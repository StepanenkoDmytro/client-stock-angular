import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { EMPTY, Subscription, catchError, interval, startWith, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AssetClass } from '../../../domain/asset-class.domain';
import { IHolding } from '../../../domain/holding.domain';
import { IInstrument } from '../../../domain/instrument.domain';
import {
  CRYPTO_EXCHANGE_CODE,
  MarketStatus,
} from '../../../domain/market-status.domain';
import { selectHoldingsList } from '../store/holdings.selectors';
import { InstrumentService } from './instrument.service';

/** Wire response from `GET /api/v1/markets/status`. */
interface MarketStatusBatchResponseWire {
  statuses: MarketStatus[];
}

/**
 * Polls `GET /api/v1/markets/status` for every exchange present in the
 * user's holdings and exposes the resulting statuses as signals. Powers
 * (1) the `pgz-market-status-badge` UI and (2) `LivePriceService`'s
 * smart-pause logic ("don't burn rate-limit on NYSE on Saturday").
 *
 * <p>Polling cadence is 1 minute — market state only ever flips on open
 * / close boundaries, so a 60s sampling rate is more than enough to keep
 * the badge correct. Countdown text is re-rendered on the same 60s tick
 * via {@link #_tick}.
 *
 * <p>Codes to query are derived from the current holdings list (Signal-
 * driven) — adding a holding on a new exchange automatically extends the
 * tracked set on the next tick.
 */
@Injectable({ providedIn: 'root' })
export class MarketStatusService {
  /** One sample per minute is enough — see class doc. */
  private static readonly POLL_INTERVAL_MS = 60_000;

  private readonly http = inject(HttpClient);
  private readonly store = inject(Store);
  private readonly instruments = inject(InstrumentService);

  private readonly holdings = toSignal(
    this.store.select(selectHoldingsList),
    { initialValue: [] as IHolding[] },
  );

  /** Exchange codes that should be polled — union of holdings' instruments. */
  private readonly trackedCodes = computed<string[]>(() => {
    const codes = new Set<string>();
    const instMap = this.instruments.instruments();
    for (const h of this.holdings()) {
      const inst = instMap.get(h.instrumentId);
      if (!inst) {
        continue;
      }
      const code = MarketStatusService.exchangeOf(inst);
      if (code) {
        codes.add(code);
      }
    }
    return Array.from(codes);
  });

  /** code → most recent status from the backend. */
  private readonly _statuses = signal<Map<string, MarketStatus>>(new Map());
  public readonly statuses = this._statuses.asReadonly();

  /**
   * Wall-clock tick (ms-epoch). Re-fires every 60s so any
   * {@link computed} that derives a "now-relative" string (countdown,
   * "opens in X") re-evaluates. Decouples display freshness from the
   * (also 60s) HTTP polling cadence — even if the network is slow, the
   * countdown text keeps updating.
   */
  private readonly _tick = signal(Date.now());
  public readonly tick = this._tick.asReadonly();

  private pollSubscription?: Subscription;
  private tickHandle?: ReturnType<typeof setInterval>;

  /**
   * Idempotent. First call starts both loops (status fetch + display
   * tick). Subsequent calls are no-ops.
   */
  init(): void {
    if (this.pollSubscription) {
      return;
    }
    this.pollSubscription = interval(MarketStatusService.POLL_INTERVAL_MS)
      .pipe(
        startWith(0),
        switchMap(() => this.fetchOnce()),
      )
      .subscribe((statuses) => this.absorb(statuses));

    this.tickHandle = setInterval(
      () => this._tick.set(Date.now()),
      MarketStatusService.POLL_INTERVAL_MS,
    );
  }

  /** Current status for a venue, or {@code undefined} if not yet fetched. */
  getStatus(code: string): MarketStatus | undefined {
    return this._statuses().get(code);
  }

  /**
   * Exchange code an {@link IInstrument} belongs to, for status purposes:
   *  - STOCK / ETF → {@code metadata.exchange} as-is
   *  - CRYPTO → {@link CRYPTO_EXCHANGE_CODE}
   *  - TOKENIZED_STOCK → {@link CRYPTO_EXCHANGE_CODE} (traded on crypto venues)
   *  - everything else → {@code undefined} (no badge)
   */
  static exchangeOf(inst: IInstrument): string | undefined {
    switch (inst.assetClass) {
      case AssetClass.STOCK:
      case AssetClass.ETF: {
        const meta = inst.metadata;
        if ('exchange' in meta && typeof meta.exchange === 'string' && meta.exchange) {
          return meta.exchange;
        }
        return undefined;
      }
      case AssetClass.CRYPTO:
      case AssetClass.TOKENIZED_STOCK:
        return CRYPTO_EXCHANGE_CODE;
      default:
        return undefined;
    }
  }

  // ---- internal ----

  private fetchOnce() {
    const codes = this.trackedCodes();
    if (codes.length === 0) {
      return EMPTY;
    }
    const params = new HttpParams().set('codes', codes.join(','));
    return this.http
      .get<MarketStatusBatchResponseWire>(
        `${environment.apiBaseUrl}/markets/status`,
        { params },
      )
      .pipe(
        switchMap((res) => [res.statuses ?? []]),
        catchError(() => EMPTY),
      );
  }

  private absorb(statuses: MarketStatus[]): void {
    if (statuses.length === 0) {
      return;
    }
    const next = new Map<string, MarketStatus>(this._statuses());
    for (const s of statuses) {
      next.set(s.code, s);
    }
    this._statuses.set(next);
  }
}
