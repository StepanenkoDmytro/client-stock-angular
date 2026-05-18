import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import {
  EMPTY,
  Subscription,
  catchError,
  interval,
  of,
  startWith,
  switchMap,
} from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AssetClass } from '../../../domain/asset-class.domain';
import { IHolding } from '../../../domain/holding.domain';
import { IInstrument } from '../../../domain/instrument.domain';
import {
  PriceDirection,
  PriceQuote,
} from '../../../domain/price-quote.domain';
import { selectHoldingsList } from '../store/holdings.selectors';
import { InstrumentService } from './instrument.service';
import { MarketStatusService } from './market-status.service';

/**
 * Wire shape of one row in `GET /api/v1/prices/batch`. Mirror of Java
 * `PriceQuoteDto`.
 */
interface PriceQuoteWire {
  instrumentId: string;
  symbol: string;
  price: number;
  currency: string;
  assetClass: AssetClass;
  capturedAt: number | string;
  stale: boolean;
}

interface PricesBatchResponseWire {
  quotes: PriceQuoteWire[];
}

/**
 * Polls `GET /api/v1/prices/batch` for every distinct instrument id in the
 * user's holdings and exposes the resulting quotes as signals.
 *
 * Architecture:
 *  - The set of "tracked" instrument ids is derived (`computed`) from the
 *    NgRx holdings list — adding / removing a holding automatically
 *    changes what we poll on the next tick. No imperative subscribe.
 *  - One poll every {@link LivePriceService.POLL_INTERVAL_MS}. PR-A5 will
 *    layer market-status-aware pausing on top (no point polling NYSE on
 *    Saturday).
 *  - Flash hints (`getFlashDirection`) auto-clear after
 *    {@link LivePriceService.FLASH_TIMEOUT_MS}; UI binds a CSS class while
 *    they are set.
 *
 * Polling starts only after {@link #init} is called from the screen that
 * needs live prices (currently `SavingsComponent`) — leaves the rest of
 * the app cold so a user never on `/savings` doesn't pay HTTP overhead.
 */
@Injectable({ providedIn: 'root' })
export class LivePriceService {
  /** Fixed polling cadence (30s). PR-A5 will adapt by market status. */
  private static readonly POLL_INTERVAL_MS = 30_000;
  /** How long a flash hint stays in the map after a price change. */
  private static readonly FLASH_TIMEOUT_MS = 600;

  private readonly http = inject(HttpClient);
  private readonly store = inject(Store);
  private readonly instruments = inject(InstrumentService);
  private readonly marketStatus = inject(MarketStatusService);

  /** Holdings list mirrored as a signal so we can derive tracked ids. */
  private readonly holdings = toSignal(
    this.store.select(selectHoldingsList),
    { initialValue: [] as IHolding[] },
  );

  /**
   * Distinct instrument ids that appear in any current holding AND whose
   * exchange is currently open (PR-A5 smart polling). Closed venues are
   * skipped so we don't burn Finnhub free-tier quota on stocks that
   * haven't moved since Friday close. CRYPTO and TOKENIZED_STOCK are
   * always included — they trade 24/7. Manual classes (CASH / DEPOSIT /
   * REAL_ESTATE / OTHER) are included unconditionally — their feeds
   * return a deterministic value with no upstream rate-limit cost.
   */
  private readonly trackedIds = computed<string[]>(() => {
    const ids = new Set<string>();
    const instMap = this.instruments.instruments();
    for (const h of this.holdings()) {
      const inst = instMap.get(h.instrumentId);
      if (inst && this.shouldSkip(inst)) {
        continue;
      }
      ids.add(h.instrumentId);
    }
    return Array.from(ids);
  });

  /** True when this instrument's exchange is known-closed at this tick. */
  private shouldSkip(inst: IInstrument): boolean {
    const code = MarketStatusService.exchangeOf(inst);
    if (!code) {
      // Manual asset classes — nothing to poll, but the price feed is
      // trivial server-side and gives us back a clean value (CASH=1.0,
      // OTHER=empty). Including is cheap and keeps the response shape
      // stable for the frontend.
      return false;
    }
    const status = this.marketStatus.getStatus(code);
    if (!status) {
      // No status fetched yet — don't gate the very first tick on it,
      // otherwise we'd never start. Status will land in <60s and the
      // next tick will apply the filter.
      return false;
    }
    return !status.isOpen;
  }

  /** id → most recent quote from the backend. */
  private readonly _quotes = signal<Map<string, PriceQuote>>(new Map());
  /** id → 'up' | 'down' for the most recent change; cleared after FLASH_TIMEOUT_MS. */
  private readonly _flashing = signal<Map<string, PriceDirection>>(new Map());

  private pollSubscription?: Subscription;
  private flashTimeout?: ReturnType<typeof setTimeout>;

  /**
   * Idempotent. First call starts the polling loop (one immediate fetch
   * plus every 30s after). Subsequent calls are no-ops — the service is
   * `providedIn: 'root'`, so a singleton already exists.
   */
  init(): void {
    if (this.pollSubscription) {
      return;
    }
    this.pollSubscription = interval(LivePriceService.POLL_INTERVAL_MS)
      .pipe(
        startWith(0),
        switchMap(() => this.fetchOnce()),
      )
      .subscribe((quotes) => this.absorb(quotes));
  }

  /** Read-only access to the current price for one instrument. */
  getCurrentPrice(instrumentId: string): number | undefined {
    return this._quotes().get(instrumentId)?.price;
  }

  /**
   * Symbol-keyed convenience used by `HoldingService.getCurrentPrice` so
   * existing call sites keep working without changing their signature.
   * Walks the InstrumentService cache once — fine for the dozen-ish
   * instruments in a personal portfolio; if portfolio sizes grow we'd
   * memoise a symbol-index here.
   */
  getCurrentPriceBySymbol(symbol: string): number | undefined {
    for (const inst of this.instruments.instruments().values()) {
      if (inst.symbol === symbol) {
        const price = this._quotes().get(inst.id)?.price;
        if (price !== undefined) {
          return price;
        }
      }
    }
    return undefined;
  }

  /** Whole snapshot for components that want to react to all quotes. */
  getCurrentQuote(instrumentId: string): PriceQuote | undefined {
    return this._quotes().get(instrumentId);
  }

  /** Auto-clearing flash direction. `null` once the flash window closes. */
  getFlashDirection(instrumentId: string): PriceDirection | null {
    return this._flashing().get(instrumentId) ?? null;
  }

  // ---- internal ----

  private fetchOnce() {
    const ids = this.trackedIds();
    if (ids.length === 0) {
      return of<PriceQuoteWire[]>([]);
    }
    const params = new HttpParams().set('ids', ids.join(','));
    return this.http
      .get<PricesBatchResponseWire>(
        `${environment.apiBaseUrl}/prices/batch`,
        { params },
      )
      .pipe(
        switchMap((res) => of(res.quotes ?? [])),
        catchError((err: HttpErrorResponse) => {
          // Transient (network / 5xx / 429): swallow and try again next tick.
          // Persistent (4xx programming errors): the response is still
          // a no-op for the UI; logging at debug avoids console spam from
          // the poll loop.
          if (typeof console !== 'undefined') {
            console.debug('LivePriceService.fetchOnce failed', err.status);
          }
          return EMPTY;
        }),
      );
  }

  private absorb(quotes: PriceQuoteWire[]): void {
    if (quotes.length === 0) {
      return;
    }
    const previous = this._quotes();
    const next = new Map<string, PriceQuote>(previous);
    const flashes = new Map<string, PriceDirection>();

    for (const q of quotes) {
      const prev = previous.get(q.instrumentId);
      next.set(q.instrumentId, {
        instrumentId: q.instrumentId,
        symbol: q.symbol,
        price: q.price,
        currency: q.currency,
        assetClass: q.assetClass,
        capturedAt: q.capturedAt,
        stale: q.stale,
      });
      // Flash only when we have a *previous* value to compare with — the
      // very first fetch doesn't flash anything (no baseline yet).
      if (prev !== undefined && prev.price !== q.price) {
        flashes.set(q.instrumentId, q.price > prev.price ? 'up' : 'down');
      }
    }

    this._quotes.set(next);

    if (flashes.size > 0) {
      this._flashing.set(flashes);
      if (this.flashTimeout) {
        clearTimeout(this.flashTimeout);
      }
      this.flashTimeout = setTimeout(() => {
        this._flashing.set(new Map());
      }, LivePriceService.FLASH_TIMEOUT_MS);
    }
  }
}
