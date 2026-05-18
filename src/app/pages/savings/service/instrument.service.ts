import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { environment } from '../../../../environments/environment';
import {
  AssetClass,
  isMarketBackedAssetClass,
} from '../../../domain/asset-class.domain';
import {
  IInstrument,
  InstrumentMetadata,
} from '../../../domain/instrument.domain';

/**
 * Parameters for getOrCreate: identify the instrument by (symbol,
 * assetClass) — that's the unique key per ADR-0001. Metadata + name must
 * match the assetClass (TypeScript enforces via discriminated union).
 */
export interface GetOrCreateParams {
  symbol: string;
  assetClass: AssetClass;
  name: string;
  currency: string;
  metadata: InstrumentMetadata;
}

/**
 * InstrumentService — feature-local Signal store + localStorage cache for
 * IInstrument objects.
 *
 * Why not NgRx: this is a **reference catalog**, not cross-feature mutable
 * state. The same data flows in two directions (market feed inflow + user
 * custom-create) but never participates in shared NgRx effects. Signal-only
 * keeps it light.
 *
 * Persistence rules:
 *  - Custom user instruments (`createdBy: 'user'`) — persisted in
 *    localStorage under `'custom-instruments'`. These can't be re-fetched
 *    (the only source of truth is the user input).
 *  - System market instruments (`createdBy: 'system'`) — NOT persisted.
 *    They're refetched from market feeds on each session via
 *    `addMarketInstruments(...)` whenever a screen needs them. Cheap to
 *    redo, avoids stale market data.
 *
 * Cross-tab sync: a `'storage'` listener re-reads the custom snapshot
 * if another tab modifies it.
 */
/**
 * Wire shape from the backend `/api/v1/markets/{stocks|coins}/search`
 * endpoints (PR8a / PR8b done reports). Mirror of Java
 * `InstrumentSearchResponse` + `InstrumentDto`.
 *
 * Notes:
 *  - `createdAt` / `lastSyncedAt` arrive as epoch+nanos right now (known
 *    QoL issue from PR8a §5). We don't read them on the frontend — only
 *    pass through to keep the field on `IInstrument` populated. When the
 *    backend switches to ISO-8601 we don't need to change anything here.
 *  - `createdBy` is `"system" | userId-uuid`. The frontend only cares
 *    about the system vs user distinction, so we collapse it.
 */
interface InstrumentDtoWire {
  id: string;
  assetClass: AssetClass;
  symbol: string;
  name: string;
  currency: string;
  metadata: InstrumentMetadata;
  createdBy: string | null;
  createdAt: unknown;
  source?: string | null;
  lastSyncedAt?: unknown;
}

interface InstrumentSearchResponseWire {
  results: InstrumentDtoWire[];
  stale: boolean;
}

/**
 * Decoded result of a market search. `stale=true` means the backend
 * returned cached results because the upstream provider was unavailable
 * or the per-day budget was exhausted (Alpha Vantage 25 req/day cap, see
 * PR8 doc §5.5). UI shows a subtle hint when this is true.
 */
export interface MarketSearchResult {
  results: IInstrument[];
  stale: boolean;
}

@Injectable({ providedIn: 'root' })
export class InstrumentService {
  private static readonly STORAGE_KEY = 'custom-instruments';

  private readonly http = inject(HttpClient);
  private readonly _instruments = signal<Map<string, IInstrument>>(new Map());

  /** Read-only signal of the entire current cache (system + user). */
  public readonly instruments = this._instruments.asReadonly();

  private isInit = false;

  init(): void {
    if (this.isInit) {
      return;
    }
    this.isInit = true;
    this.loadCustomFromStorage();

    window.addEventListener('storage', (event) => {
      if (event.key === InstrumentService.STORAGE_KEY) {
        this.loadCustomFromStorage();
      }
    });
  }

  /**
   * Synchronous search across the entire cache.
   *
   * Filtering:
   *  - case-insensitive substring match on `symbol` and `name`;
   *  - optional `assetClass` filter (omit to include all classes);
   *  - empty query returns the full filtered set (useful when autocomplete
   *    opens before user types).
   *
   * Returns a fresh array sorted alphabetically by symbol. Callers in PR5
   * wrap this in their own `computed(() => instrumentService.search(...))`
   * to get reactivity over both `_instruments` and their query signal.
   */
  search(query: string, assetClass?: AssetClass): IInstrument[] {
    const all = Array.from(this._instruments().values());
    const filtered = all.filter((i) => {
      if (assetClass && i.assetClass !== assetClass) {
        return false;
      }
      if (!query) {
        return true;
      }
      const q = query.toLowerCase();
      return (
        i.symbol.toLowerCase().includes(q) ||
        i.name.toLowerCase().includes(q)
      );
    });
    filtered.sort((a, b) => a.symbol.localeCompare(b.symbol));
    return filtered;
  }

  getById(id: string): IInstrument | undefined {
    return this._instruments().get(id);
  }

  /**
   * HTTP search against the backend market-search endpoints
   * (`/api/v1/markets/stocks/search` for STOCK/ETF;
   * `/api/v1/markets/coins/search` for CRYPTO/TOKENIZED_STOCK).
   *
   * Side effect: every result is also written into the in-memory
   * `_instruments` cache so subsequent sync calls (`search`, `getById`)
   * find the freshly-pulled record without another HTTP round-trip.
   *
   * Manual classes (CASH, DEPOSIT, REAL_ESTATE, OTHER) are not market-
   * backed — the caller is expected to fall back to `search()` (sync
   * local) for those. Calling `searchMarket()` with a manual class
   * returns `EMPTY` immediately rather than hitting a 400 from the
   * backend.
   *
   * Error handling:
   *  - HTTP 429 / 503 / network: returns `{ results: [], stale: true }`
   *    so the autocomplete dropdown can render a subtle hint and the
   *    caller can fall back to local sync results.
   *  - Per PR8 spec the backend may return `stale=true` even on 200 —
   *    we propagate that flag unchanged.
   */
  searchMarket(
    query: string,
    assetClass: AssetClass,
    limit = 20,
  ): Observable<MarketSearchResult> {
    if (!isMarketBackedAssetClass(assetClass)) {
      return of({ results: [], stale: false });
    }
    const trimmed = query.trim();
    if (!trimmed) {
      return of({ results: [], stale: false });
    }

    const endpoint = this.endpointFor(assetClass);
    const params = new HttpParams()
      .set('q', trimmed)
      .set('assetClass', assetClass)
      .set('limit', String(limit));

    return this.http
      .get<InstrumentSearchResponseWire>(`${environment.apiBaseUrl}${endpoint}`, {
        params,
      })
      .pipe(
        map((res) => this.absorbSearchResponse(res)),
        catchError((err: HttpErrorResponse) => {
          // 400/401 propagate as empty-not-stale so we don't show a
          // misleading "data may be outdated" message for a programming
          // error. 429/503/network → stale-true so the UI can hint at
          // a temporary outage and fall back gracefully.
          const transient = err.status === 0 || err.status === 429 || err.status >= 500;
          return of({ results: [] as IInstrument[], stale: transient });
        }),
      );
  }

  /** Picks the backend endpoint based on the asset class. Keep in sync
   *  with `MARKET_BACKED_ASSET_CLASSES`. */
  private endpointFor(assetClass: AssetClass): string {
    switch (assetClass) {
      case AssetClass.STOCK:
      case AssetClass.ETF:
        return '/markets/stocks/search';
      case AssetClass.CRYPTO:
      case AssetClass.TOKENIZED_STOCK:
        return '/markets/coins/search';
      default:
        // Unreachable — guarded by isMarketBackedAssetClass(). Keep TS
        // happy and crash loudly if a future class is added without
        // updating this switch.
        throw new Error(`No market endpoint for ${assetClass}`);
    }
  }

  /** Materialises wire DTOs into `IInstrument` and caches them. Returns
   *  the parsed list + stale flag so the caller can render a hint. */
  private absorbSearchResponse(
    res: InstrumentSearchResponseWire,
  ): MarketSearchResult {
    const next = new Map(this._instruments());
    const parsed: IInstrument[] = [];
    for (const dto of res.results ?? []) {
      const inst = this.fromWireDto(dto);
      next.set(inst.id, inst);
      parsed.push(inst);
    }
    this._instruments.set(next);
    return { results: parsed, stale: !!res.stale };
  }

  private fromWireDto(dto: InstrumentDtoWire): IInstrument {
    return {
      id: dto.id,
      assetClass: dto.assetClass,
      symbol: dto.symbol,
      name: dto.name,
      currency: dto.currency,
      metadata: dto.metadata,
      // Backend sends "system" for null `created_by` (or a userId UUID
      // for custom). The frontend cares only about the binary, so
      // collapse: anything not literally "system" is user-owned.
      createdBy: dto.createdBy === 'system' ? 'system' : 'user',
      // Pass through whatever the backend gave (epoch+nanos right now,
      // ISO once they upgrade Jackson) — UI doesn't read it directly.
      createdAt: String(dto.createdAt ?? ''),
    };
  }

  /**
   * Find an instrument by (symbol, assetClass) — return it if present,
   * otherwise create a new user-instrument and persist to localStorage.
   *
   * Used by:
   *  - The "Create custom instrument" inline form (PR5) for CASH /
   *    DEPOSIT / REAL_ESTATE / OTHER classes.
   *  - The Holding migration in HoldingService (PR4) when an existing
   *    asset matches no known instrument.
   */
  getOrCreate(params: GetOrCreateParams): IInstrument {
    const existing = this.findBySymbol(params.symbol, params.assetClass);
    if (existing) {
      return existing;
    }

    const created: IInstrument = {
      id: uuid(),
      assetClass: params.assetClass,
      symbol: params.symbol,
      name: params.name,
      currency: params.currency,
      metadata: params.metadata,
      createdBy: 'user',
      createdAt: new Date().toISOString(),
    };
    this.insert(created);
    this.persistCustom();
    return created;
  }

  /**
   * Bulk-insert market-derived instruments. Does NOT persist them to
   * localStorage — system instruments are refetched per session. If a
   * conflicting (same symbol+assetClass) user instrument exists, the
   * incoming market one is skipped.
   */
  addMarketInstruments(list: IInstrument[]): void {
    const next = new Map(this._instruments());
    let mutated = false;
    for (const inc of list) {
      const conflict = this.findInMap(next, inc.symbol, inc.assetClass);
      if (conflict) {
        continue;
      }
      next.set(inc.id, inc);
      mutated = true;
    }
    if (mutated) {
      this._instruments.set(next);
    }
  }

  /** All instruments in the cache (system + user). */
  getAll(): IInstrument[] {
    return Array.from(this._instruments().values());
  }

  /**
   * Wipe the in-memory cache AND the persisted custom snapshot. Used by
   * the "Reset demo data" flow on `/savings/holdings` while we're still
   * in the mock-seed phase (pre-PR5).
   */
  reset(): void {
    this._instruments.set(new Map());
    localStorage.removeItem(InstrumentService.STORAGE_KEY);
  }

  // -- internal --

  private insert(instrument: IInstrument): void {
    const next = new Map(this._instruments());
    next.set(instrument.id, instrument);
    this._instruments.set(next);
  }

  private findBySymbol(
    symbol: string,
    assetClass: AssetClass,
  ): IInstrument | undefined {
    return this.findInMap(this._instruments(), symbol, assetClass);
  }

  private findInMap(
    map: Map<string, IInstrument>,
    symbol: string,
    assetClass: AssetClass,
  ): IInstrument | undefined {
    for (const i of map.values()) {
      if (i.symbol === symbol && i.assetClass === assetClass) {
        return i;
      }
    }
    return undefined;
  }

  private loadCustomFromStorage(): void {
    const raw = localStorage.getItem(InstrumentService.STORAGE_KEY);
    if (!raw) {
      // Reset to empty-with-no-custom, but preserve any system instruments
      // already in the cache from market feeds.
      this.replaceCustomSlice([]);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as IInstrument[];
      this.replaceCustomSlice(parsed);
    } catch {
      // Corrupted snapshot — treat as empty.
      this.replaceCustomSlice([]);
    }
  }

  private replaceCustomSlice(custom: IInstrument[]): void {
    const next = new Map<string, IInstrument>();
    // Keep all current system instruments.
    for (const inst of this._instruments().values()) {
      if (inst.createdBy === 'system') {
        next.set(inst.id, inst);
      }
    }
    // Re-insert the custom set from storage.
    for (const inst of custom) {
      next.set(inst.id, inst);
    }
    this._instruments.set(next);
  }

  private persistCustom(): void {
    const custom = Array.from(this._instruments().values()).filter(
      (i) => i.createdBy === 'user',
    );
    localStorage.setItem(
      InstrumentService.STORAGE_KEY,
      JSON.stringify(custom),
    );
  }
}
