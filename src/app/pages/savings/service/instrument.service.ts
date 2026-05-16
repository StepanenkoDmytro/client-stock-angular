import { Injectable, signal } from '@angular/core';
import { v4 as uuid } from 'uuid';
import { AssetClass } from '../../../domain/asset-class.domain';
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
@Injectable({ providedIn: 'root' })
export class InstrumentService {
  private static readonly STORAGE_KEY = 'custom-instruments';

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
