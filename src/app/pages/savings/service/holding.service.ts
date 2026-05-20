import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { EMPTY, Observable, catchError, filter, firstValueFrom, map, tap } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { environment } from '../../../../environments/environment';
import { AccountKind } from '../../../domain/account-kind.domain';
import {
  AssetClass,
  isMarketBackedAssetClass,
} from '../../../domain/asset-class.domain';
import { IHolding, IHoldingLockMeta } from '../../../domain/holding.domain';
import { IInstrument } from '../../../domain/instrument.domain';
import { ITag } from '../../../domain/tag.domain';
import { AuthService } from '../../../service/auth.service';
import { OfflineStorageService } from '../../../core/offline-storage/offline-storage.service';
import { MANUAL_ACCOUNT_ID } from '../model/HoldingMapper';
import {
  addHolding,
  assignTags,
  deleteHolding,
  editHolding,
  loadHoldings,
} from '../store/holdings.actions';
import { IHoldingsState } from '../store/holdings.reducer';
import {
  selectHoldingsList,
  selectHoldingsState,
} from '../store/holdings.selectors';
import { selectTagsList } from '../store/tags.selectors';
import {
  HoldingApiDto,
  HoldingApiService,
  HoldingCreateRequest,
  HoldingTopUpRequest,
  HoldingUpdateRequest,
} from './holding-api.service';
import { InstrumentService } from './instrument.service';
import { LivePriceService } from './live-price.service';
import { TagsService } from './tags.service';

/**
 * HoldingService — feature-local CRUD + localStorage sync for `IHolding`.
 *
 * Mirrors `TagsService` shape: NgRx is the source of truth, localStorage is
 * the offline snapshot. No REST sync yet — M5 plugs in `HoldingsEffects`.
 *
 * Bootstrap behaviour (demo phase, until PR5 form ships):
 *  - If `'holdings-list'` exists AND has any items → load it as-is.
 *  - If `'holdings-list'` is missing OR contains an empty list → seed
 *    5 example holdings across asset classes + tags so the user can SEE
 *    the new model without entering anything manually.
 *
 * The legacy `'assets-list'` key is NOT consulted here — both stores
 * coexist until the real migration via `HoldingMapper.fromIAsset` lands.
 * Once PR5 ships, this seed will be guarded behind `environment.demoData`
 * or removed entirely.
 */
@Injectable({ providedIn: 'root' })
export class HoldingService {
  private static readonly STORAGE_KEY = 'holdings-list';
  private static readonly SEED_VERSION_KEY = 'holdings-seed-version';
  /**
   * Side cache for the seed's market-backed Instrument resolutions. Lives
   * separately from `'custom-instruments'` (manual classes only) and is
   * intentionally **not** wiped by `resetDemoData()` / `InstrumentService.reset()`
   * so dev resets don't repeatedly burn the Alpha Vantage 25 req/day quota
   * (see live-prices doc §8 — quota mitigation).
   */
  private static readonly SEED_INSTRUMENTS_KEY = 'holdings-seed-market-instruments';

  /**
   * Bumps every time the mock-seed shape or contents change in a way that
   * makes the *previous* seed look wrong against the *current* UI. The
   * bootstrap path compares this with the value cached in localStorage —
   * mismatch wipes the snapshot and re-seeds so dev users automatically
   * pick up new fixtures without remembering to press "Reset demo data".
   *
   *  v1: original five holdings, one per instrument, all MANUAL account.
   *  v2: PR6 — adds accountKind, lockMeta, openedAt; BTC×3, AAPL×2,
   *      AAPL.X×1 multi-location seed.
   *  v3: Stats Task 1 — Monobank gets primary USD cash, manual keeps a
   *      smaller cash dust + the apartment. Ensures every demo account
   *      has ≥1 holding so the new portfolio-stats widgets (W1/W2/W3)
   *      render a full distribution out of the box.
   *  v4: PR1 live-prices cleanup — market-backed seed instruments now
   *      resolve through `instrumentService.searchMarket()` so their ids
   *      match the backend catalog and the `/prices/batch` poll returns
   *      real Alpha Vantage / CoinGecko quotes. Pre-v4 snapshots reference
   *      client-UUID instruments that the backend doesn't know about, so
   *      we wipe and re-seed.
   *
   * Goes away when M5 wires real backend data — seed disappears with it.
   */
  private static readonly SEED_VERSION = 4;

  private static readonly DELETE_QUEUE_KEY = 'holdings';

  private readonly store$ = inject(Store<{ holdings: IHoldingsState }>);
  private readonly instruments = inject(InstrumentService);
  private readonly livePrice = inject(LivePriceService);
  private readonly tags = inject(TagsService);
  private readonly api = inject(HoldingApiService);
  private readonly auth = inject(AuthService);
  private readonly offlineStorage = inject(OfflineStorageService);

  private isInit = false;

  init(): void {
    if (this.isInit) {
      return;
    }
    this.isInit = true;

    // Ensure dependencies are bootstrapped first — we need instruments
    // and tag IDs to seed mock holdings.
    this.instruments.init();
    this.tags.init();

    this.bootstrap();

    this.store$
      .pipe(
        select(selectHoldingsState),
        filter((state) => !!state),
      )
      .subscribe((state) => {
        localStorage.setItem(
          HoldingService.STORAGE_KEY,
          JSON.stringify(state),
        );
      });

    window.addEventListener('storage', (event) => {
      if (event.key === HoldingService.STORAGE_KEY) {
        this.bootstrap(true);
      }
    });
  }

  getAll(): Observable<IHolding[]> {
    return this.store$.pipe(select(selectHoldingsList));
  }

  /**
   * Demo-only direct store insert. Used by {@link #runSeed} to materialise
   * mock fixtures. Production callers use {@link #addHolding} (REST-first).
   */
  private addHoldingLocal(holding: IHolding): void {
    this.store$.dispatch(addHolding({ holding }));
  }

  /**
   * Legacy local-only edit. Reducer arithmetic for the optional top-up
   * formula lives here for backward compat (demo-mode "Reset" flow, any
   * unmigrated caller). Production write paths go through {@link #update}
   * and {@link #topUp}, which round-trip the change through the backend
   * and then dispatch the server-canonical row.
   */
  editHolding(
    id: string,
    patch: Partial<IHolding>,
    addQuantity = 0,
    addPrice = 0,
  ): void {
    this.store$.dispatch(
      editHolding({ id, addQuantity, addPrice, patch }),
    );
  }

  /**
   * Create a holding. Three flavours depending on caller context:
   *
   *  1. **Demo mode** (`environment.demoData=true`) — local dispatch only,
   *     no API. Screenshot / story sessions stay self-contained.
   *  2. **Anonymous** (no `authToken`, production build) — local dispatch
   *     with `isSaved: false`. The signup-merge wizard (Phase 3b PR5)
   *     scans for these and batch-uploads them after sign-in. Per ADR-0012
   *     §Anonymous-mode.
   *  3. **Authenticated** — REST-first: POST `/api/v1/holdings`, dispatch
   *     the server-shaped row (`isSaved: true`). The local UUID we sent
   *     is replaced by the server-generated id — UI flickers once,
   *     acceptable trade-off until backend accepts client UUIDs.
   */
  addHolding(holding: IHolding): Observable<IHolding> {
    if (environment.demoData || !this.auth.authToken) {
      this.addHoldingLocal({ ...holding, isSaved: false });
      return new Observable<IHolding>((sub) => { sub.next(holding); sub.complete(); });
    }
    return this.api.create(this.toCreateRequest(holding)).pipe(
      map(HoldingService.fromApiDto),
      map((saved) => ({ ...saved, isSaved: true })),
      tap((saved) => this.store$.dispatch(addHolding({ holding: saved }))),
    );
  }

  /**
   * Pure edit (no avg-price recompute). Local-first: dispatch with
   * `isSaved: false` immediately so the UI reflects the change without
   * waiting on the round-trip. If authenticated, fire the PUT in
   * background; on success dispatch the server-canonical patch with
   * `isSaved: true`. Anonymous / demo skip the API entirely.
   */
  update(id: string, body: HoldingUpdateRequest): Observable<IHolding> {
    this.dispatchLocalPatch(id, this.toLocalPatch(body), 0, 0);
    if (environment.demoData || !this.auth.authToken) {
      return this.getLocalById(id);
    }
    return this.api.update(id, body).pipe(
      map(HoldingService.fromApiDto),
      tap((saved) => this.dispatchSavedPatch(id, saved)),
    );
  }

  /**
   * Top-up: avg-buy-price weighted-average recompute. Same local-first
   * pattern as {@link #update}. The reducer's existing `addQuantity > 0`
   * branch applies the formula locally; the server's response (also
   * weighted-avg per ADR-0001) replaces our local result on success so
   * any rounding drift collapses to the canonical value.
   */
  topUp(id: string, body: HoldingTopUpRequest): Observable<IHolding> {
    this.dispatchLocalPatch(id, {}, body.addQuantity, body.addBuyPrice);
    if (environment.demoData || !this.auth.authToken) {
      return this.getLocalById(id);
    }
    return this.api.topUp(id, body).pipe(
      map(HoldingService.fromApiDto),
      tap((saved) => this.dispatchSavedPatch(id, saved)),
    );
  }

  /**
   * Delete. Local-first: drop the row from the store immediately.
   * Authenticated path fires DELETE; on transient failure (network /
   * 5xx) the id is enqueued via {@link OfflineStorageService} so the
   * next sync drains it (Phase 3b PR1 generic queue). Anonymous / demo
   * skip the API; nothing to re-sync since the record is purely local.
   */
  deleteHolding(id: string): Observable<void> {
    this.store$.dispatch(deleteHolding({ id }));
    if (environment.demoData || !this.auth.authToken) {
      return new Observable<void>((sub) => { sub.next(); sub.complete(); });
    }
    return this.api.delete(id).pipe(
      catchError((err: HttpErrorResponse) => {
        if (HoldingService.isTransient(err)) {
          this.offlineStorage.enqueueDelete(HoldingService.DELETE_QUEUE_KEY, id);
        }
        return EMPTY;
      }),
    );
  }

  private dispatchLocalPatch(
    id: string,
    patch: Partial<IHolding>,
    addQuantity: number,
    addPrice: number,
  ): void {
    this.store$.dispatch(
      editHolding({
        id,
        addQuantity,
        addPrice,
        patch: { ...patch, isSaved: false },
      }),
    );
  }

  private dispatchSavedPatch(id: string, saved: IHolding): void {
    this.store$.dispatch(
      editHolding({
        id,
        addQuantity: 0,
        addPrice: 0,
        patch: { ...HoldingService.toPatch(saved), isSaved: true },
      }),
    );
  }

  private static isTransient(error: HttpErrorResponse): boolean {
    return error.status === 0 || error.status === 429 ||
      (error.status >= 500 && error.status < 600);
  }

  assignTags(holdingId: string, tagIds: string[]): void {
    this.store$.dispatch(assignTags({ holdingId, tagIds }));
  }

  // ---- mapping helpers ----

  private toCreateRequest(h: IHolding): HoldingCreateRequest {
    // UI `accountId` is sometimes a literal string ('manual', 'acc-ibkr')
    // from the legacy seed, sometimes a numeric DB id stringified by
    // {@link #fromApiDto}. Only forward numeric ids; the backend
    // (HoldingApiService.resolveAccount) auto-creates a Manual account
    // when accountId is missing.
    const acc = h.accountId !== undefined ? Number(h.accountId) : NaN;
    return {
      instrumentId: h.instrumentId,
      quantity: h.quantity,
      averageBuyPrice: h.averageBuyPrice,
      currency: h.currency || undefined,
      openedAt: h.openedAt,
      accountId: Number.isFinite(acc) ? acc : undefined,
      // `IHoldingLockMeta` is structurally identical to `HoldingLockMetaWire`
      // (same `kind` discriminator + same field names), so a direct cast
      // is safe — JSON serialization round-trips cleanly via the Java
      // sealed interface with `@JsonTypeInfo(property = "kind")`.
      lockMeta: h.lockMeta as HoldingCreateRequest['lockMeta'],
    };
  }

  private toLocalPatch(body: HoldingUpdateRequest): Partial<IHolding> {
    const patch: Partial<IHolding> = {};
    if (body.quantity !== undefined) patch.quantity = body.quantity;
    if (body.averageBuyPrice !== undefined) patch.averageBuyPrice = body.averageBuyPrice;
    if (body.currency !== undefined) patch.currency = body.currency;
    return patch;
  }

  private static toPatch(h: IHolding): Partial<IHolding> {
    return {
      quantity: h.quantity,
      averageBuyPrice: h.averageBuyPrice,
      currency: h.currency,
      accountId: h.accountId,
      accountName: h.accountName,
      accountKind: h.accountKind,
      tagIds: h.tagIds,
      updatedAt: h.updatedAt,
    };
  }

  /** Demo-mode helper: emit the just-dispatched row from the store. */
  private getLocalById(id: string): Observable<IHolding> {
    return this.store$.pipe(
      select(selectHoldingsList),
      map((list) => list.find((h) => h.id === id)),
      filter((h): h is IHolding => h !== undefined),
    );
  }

  /**
   * Current market price for a symbol. Resolution order:
   *
   *   1. {@link LivePriceService} — live quote from backend polling.
   *   2. {@link HoldingService.DEMO_FALLBACK_PRICES} — **only in demo
   *      mode** (`environment.demoData=true`). Covers the dev-without-
   *      backend case so the seeded dashboard still shows realistic
   *      numbers (BTC ≈ $58k, AAPL ≈ $175) instead of cost basis ≈
   *      $40k / $156. Production / anonymous-production skip this tier
   *      and fall through to undefined → cost-basis fallback in UI.
   *   3. `undefined` — caller decides (typically `?? averageBuyPrice`
   *      per live-prices doc §3 Rule 2).
   *
   * PR7 removed the original `MOCK_CURRENT_PRICES` table assuming PR1's
   * searchMarket-seed always lands real backend quotes. That assumption
   * holds with backend running; the demo-mode fallback below restores
   * the offline-dev experience without polluting production.
   */
  getCurrentPrice(symbol: string): number | undefined {
    const live = this.livePrice.getCurrentPriceBySymbol(symbol);
    if (live !== undefined) {
      return live;
    }
    if (environment.demoData) {
      return HoldingService.DEMO_FALLBACK_PRICES[symbol];
    }
    return undefined;
  }

  /**
   * Demo-mode-only price table consulted by {@link #getCurrentPrice}
   * when the live polling has no value (typical for `npm start` without
   * `docker compose up stock-archive-server`). Mirrors the symbols in
   * the seed (`seedMockHoldings`) plus their approximate current market
   * values so screenshots and story sessions look realistic. Production
   * builds skip this table — they only see real Alpha Vantage /
   * CoinGecko quotes or cost-basis fallback.
   */
  private static readonly DEMO_FALLBACK_PRICES: Record<string, number> = {
    AAPL: 175.0,
    'AAPL.X': 176.0,
    MSFT: 410.0,
    BTC: 58000.0,
    USD: 1.0,
    'KYIV-APT-1': 110000.0,
  };

  /**
   * Public reset for the holdings-list screen. Wipes the holdings
   * snapshot from localStorage (and the user-instruments side-cache
   * so re-seed creates them fresh), then re-runs the seed path.
   * Used by the "Reset demo data" button on `/savings/holdings`.
   */
  resetDemoData(): void {
    if (!environment.demoData) {
      // Guard against the "Reset demo data" button being wired up in a
      // production build by accident — a tester clicking it would wipe
      // their real saved holdings to repopulate fake AAPL/BTC fixtures.
      return;
    }
    localStorage.removeItem(HoldingService.STORAGE_KEY);
    localStorage.removeItem(HoldingService.SEED_VERSION_KEY);
    // Force the instrument cache back to empty so getOrCreate produces
    // brand-new IDs for the mock instruments; otherwise stale ones from
    // the in-memory cache would be reused.
    this.instruments.reset();
    this.runSeed();
  }

  // -- internal --

  private bootstrap(forceReload = false): void {
    const raw = localStorage.getItem(HoldingService.STORAGE_KEY);
    const cachedVersion = Number(
      localStorage.getItem(HoldingService.SEED_VERSION_KEY) ?? '0',
    );

    // Stale seed format from a previous app version → wipe and re-seed.
    // Only applies in demo mode — production keeps whatever's in localStorage
    // (or empty, which is what real beta testers start from).
    const seedOutdated =
      environment.demoData && cachedVersion !== HoldingService.SEED_VERSION;

    let usedCache = false;
    if (raw && !seedOutdated) {
      try {
        const state = JSON.parse(raw) as IHoldingsState;
        if (state.holdingsList && state.holdingsList.length > 0) {
          this.store$.dispatch(loadHoldings({ state }));
          usedCache = true;
          if (environment.demoData) {
            // Demo mode — cache hit is the full story, no backend round-trip.
            return;
          }
          // Production — cache shown for instant UX; fall through to
          // re-hydrate from the backend below.
        }
        // Empty snapshot — fall through to re-seed (demo phase) or
        // leave an empty store (production beta).
      } catch {
        // Corrupted — fall through to seed (demo) or empty (prod).
      }
    }
    if (forceReload) {
      // Cross-tab reload event with no snapshot present; bail quietly.
      return;
    }

    if (seedOutdated) {
      // Drop the legacy snapshot AND the side-cache of mock instruments
      // so the new seed regenerates everything from scratch (e.g. the
      // legacy UAH cash instrument doesn't linger in the InstrumentService
      // cache when the new seed only ships USD).
      localStorage.removeItem(HoldingService.STORAGE_KEY);
      this.instruments.reset();
    }

    // Real beta testers (production build) — backend is the source of truth.
    // If we haven't already shown a localStorage cache above, push an empty
    // state so the UI doesn't show stale demo fixtures during the round-trip.
    //
    // Anonymous mode (Phase 3b): if there's no auth token we *don't* hit
    // the backend — `/holdings` would 401, the interceptor would silently
    // try `/refresh-token`, also fail, then logout-redirect. For an
    // anonymous user that's a forced redirect to /sign-in on every visit.
    // Skip the GET; the local store (already loaded from cache, or empty)
    // is the source of truth until they sign in.
    if (!environment.demoData) {
      if (!usedCache) {
        this.store$.dispatch(
          loadHoldings({ state: { holdingsList: [] } }),
        );
      }
      if (this.auth.authToken) {
        this.hydrateFromBackend();
      }
      return;
    }

    // Demo / story / screenshot mode — seed the mock fixtures.
    this.runSeed();
  }

  /**
   * Pulls the canonical holdings list from `GET /api/v1/holdings` and
   * replaces the in-memory store. Cache-then-server pattern: callers see
   * the localStorage snapshot immediately (via {@link #bootstrap}), then
   * this method overwrites it with the authoritative server state ~1
   * round-trip later. On network / 5xx errors we keep the cached state —
   * the global HTTP interceptor (separate file) surfaces the snackbar.
   */
  private hydrateFromBackend(): void {
    // Drain any DELETEs that were queued during a prior offline session.
    // Best-effort — the OfflineStorageService clears the queue on read,
    // and any re-failure re-enqueues via `deleteHolding`'s catchError.
    this.drainFailedDeletes();

    this.api.list().subscribe({
      next: (dtos) => {
        const list = dtos
          .map(HoldingService.fromApiDto)
          .map((h) => ({ ...h, isSaved: true }));
        this.store$.dispatch(
          loadHoldings({ state: { holdingsList: list } }),
        );
      },
      error: () => {
        // Keep whatever localStorage cache already populated the store.
        // User sees stale data + a global snackbar from the HTTP interceptor.
      },
    });
  }

  private drainFailedDeletes(): void {
    const queue = this.offlineStorage.drainDeletes(HoldingService.DELETE_QUEUE_KEY);
    for (const id of queue) {
      this.api.delete(id)
        .pipe(catchError((err: HttpErrorResponse) => {
          if (HoldingService.isTransient(err)) {
            this.offlineStorage.enqueueDelete(HoldingService.DELETE_QUEUE_KEY, id);
          }
          return EMPTY;
        }))
        .subscribe();
    }
  }

  /**
   * Maps a backend {@link HoldingApiDto} to the frontend {@link IHolding}
   * shape. Account id is stringified to align with the UI's mixed-id
   * convention (legacy 'manual' string + numeric ids from real accounts).
   * {@code lockMeta} round-trips as-is (Liquibase 2.0.5 persists it as
   * JSONB with the {@code kind} discriminator the frontend already uses).
   */
  private static fromApiDto(d: HoldingApiDto): IHolding {
    return {
      id: d.id,
      instrumentId: d.instrumentId,
      accountId: d.accountId != null ? String(d.accountId) : undefined,
      accountName: d.accountName ?? undefined,
      accountKind: (d.accountKind as AccountKind | null) ?? undefined,
      openedAt: d.openedAt ?? undefined,
      quantity: d.quantity,
      averageBuyPrice: d.averageBuyPrice,
      currency: d.currency ?? '',
      tagIds: d.tagIds ?? [],
      lockMeta: (d.lockMeta as IHolding['lockMeta'] | null) ?? undefined,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    };
  }

  /**
   * Materialises the demo seed and persists the seed version so the next
   * bootstrap doesn't re-trigger the migration path.
   *
   * Async since v4 — market-backed instruments are resolved through the
   * backend search endpoints so their ids match the catalog. The UI shows
   * an empty store for the ~one-round-trip it takes (or longer if the
   * backend is offline + nothing in the seed cache — then we fall back to
   * client-UUID getOrCreate just like v3).
   */
  private runSeed(): void {
    this.seedMockHoldings().then((seeded) => {
      this.store$.dispatch(
        loadHoldings({ state: { holdingsList: seeded } }),
      );
      localStorage.setItem(
        HoldingService.SEED_VERSION_KEY,
        String(HoldingService.SEED_VERSION),
      );
    });
  }

  /**
   * Generates 9 demo holdings spread across AssetClass enum AND multiple
   * Accounts per Instrument. Hand-crafted to exercise the Position-card
   * aggregation path introduced in PR6:
   *
   *  - **BTC** lives at 3 locations (cold wallet, exchange earn, exchange spot)
   *    so the Position card shows the multi-location chevron + breakdown
   *    with cold / earn / spot icons + a STAKING countdown.
   *  - **AAPL** lives at 2 brokers (IBKR + Robinhood) to exercise the
   *    "across 2 locations" subline without lock semantics.
   *  - **AAPL.X** sits alone on Bybit Spot — tokenised flavour of AAPL,
   *    rendered in its own `TOKENIZED_STOCK` class group.
   *  - **MSFT / USD / KYIV-APT-1** stay single-location so single-holding
   *    Position-card path is also covered.
   *
   * The seed resolves market-backed Instruments (STOCK / ETF / CRYPTO /
   * TOKENIZED_STOCK) through `InstrumentService.searchMarket()` so their
   * ids match the backend catalog and live polling returns real Alpha
   * Vantage / CoinGecko quotes (live-prices doc §2, Option B). Resolutions
   * are persisted in {@link HoldingService.SEED_INSTRUMENTS_KEY} so dev
   * resets don't re-hit the API and burn the 25 req/day quota. On failure
   * (server down, network, empty results, non-market class) the seed falls
   * back to `getOrCreate` with a client-side UUID — those holdings won't
   * get live prices but the dashboard still renders. Tags resolved by name
   * against the snapshot captured at seed-time. Each holding carries
   * `accountKind`/`accountName` directly — heuristic inference (ADR-0001)
   * waits for the real Account model in M2.
   */
  private async seedMockHoldings(): Promise<IHolding[]> {
    const now = new Date().toISOString();
    const allTags = this.readTagsSnapshot();
    const tagId = (name: string): string | undefined =>
      allTags.find((t) => t.name === name && t.system)?.id;

    interface InstrumentSpec {
      symbol: string;
      assetClass: AssetClass;
      name: string;
      currency: string;
      metadata: IInstrument['metadata'];
    }

    interface HoldingSpec {
      symbol: string;
      accountId: string;
      accountName: string;
      accountKind: AccountKind;
      quantity: number;
      avgBuyPrice: number;
      tags: string[];
      lockMeta?: IHoldingLockMeta;
      openedAt?: string;
    }

    const instruments: InstrumentSpec[] = [
      {
        symbol: 'AAPL',
        assetClass: AssetClass.STOCK,
        name: 'Apple Inc.',
        currency: 'USD',
        metadata: {
          kind: AssetClass.STOCK,
          exchange: 'NASDAQ',
          currency: 'USD',
          country: 'US',
          sector: 'Technology',
          industry: 'Consumer Electronics',
          dividendYield: 0.005,
        },
      },
      {
        symbol: 'AAPL.X',
        assetClass: AssetClass.TOKENIZED_STOCK,
        name: 'Apple Inc. (tokenised)',
        currency: 'USD',
        metadata: {
          kind: AssetClass.TOKENIZED_STOCK,
          underlyingSymbol: 'AAPL',
          tokenSymbol: 'AAPL.X',
          exchange: 'Bybit',
          blockchain: 'Ethereum',
        },
      },
      {
        symbol: 'MSFT',
        assetClass: AssetClass.STOCK,
        name: 'Microsoft Corp.',
        currency: 'USD',
        metadata: {
          kind: AssetClass.STOCK,
          exchange: 'NASDAQ',
          currency: 'USD',
          country: 'US',
          sector: 'Technology',
          industry: 'Software',
          dividendYield: 0.008,
        },
      },
      {
        symbol: 'BTC',
        assetClass: AssetClass.CRYPTO,
        name: 'Bitcoin',
        currency: 'USD',
        metadata: { kind: AssetClass.CRYPTO, coinId: 'bitcoin' },
      },
      {
        // Pre-M3 (no FxRateService): keep cash in USD so portfolio summary
        // aggregates cleanly. When FX lands we'll add UAH/EUR/PLN variants.
        symbol: 'USD',
        assetClass: AssetClass.CASH,
        name: 'USD Cash',
        currency: 'USD',
        metadata: { kind: AssetClass.CASH, currency: 'USD' },
      },
      {
        symbol: 'KYIV-APT-1',
        assetClass: AssetClass.REAL_ESTATE,
        name: 'Apartment in Kyiv',
        currency: 'USD',
        metadata: {
          kind: AssetClass.REAL_ESTATE,
          currency: 'USD',
          country: 'UA',
          propertyType: 'APARTMENT',
        },
      },
    ];

    const holdingSpecs: HoldingSpec[] = [
      // --- AAPL across 2 brokers ---
      {
        symbol: 'AAPL',
        accountId: 'acc-ibkr',
        accountName: 'Interactive Brokers',
        accountKind: 'BROKERAGE_CASH',
        quantity: 12,
        avgBuyPrice: 152.4,
        tags: ['Long-term', 'Dividend', 'Pension'],
      },
      {
        symbol: 'AAPL',
        accountId: 'acc-robinhood',
        accountName: 'Robinhood',
        accountKind: 'BROKERAGE_CASH',
        quantity: 5,
        avgBuyPrice: 168.1,
        tags: ['Short-term', 'Trading'],
      },
      // --- AAPL.X (tokenised) — single location on Bybit Spot ---
      {
        symbol: 'AAPL.X',
        accountId: 'acc-bybit-spot',
        accountName: 'Bybit Spot',
        accountKind: 'EXCHANGE_SPOT',
        quantity: 8,
        avgBuyPrice: 170.0,
        tags: ['Speculative', 'Trading'],
      },
      // --- MSFT — single broker ---
      {
        symbol: 'MSFT',
        accountId: 'acc-ibkr',
        accountName: 'Interactive Brokers',
        accountKind: 'BROKERAGE_CASH',
        quantity: 8,
        avgBuyPrice: 310,
        tags: ['Long-term', 'Growth', 'Pension'],
      },
      // --- BTC across 3 locations ---
      {
        symbol: 'BTC',
        accountId: 'acc-trezor',
        accountName: 'Cold wallet (Trezor)',
        accountKind: 'WALLET_COLD',
        quantity: 0.15,
        avgBuyPrice: 38000,
        openedAt: '2024-01-15T00:00:00.000Z',
        tags: ['Long-term', 'Pension'],
      },
      {
        symbol: 'BTC',
        accountId: 'acc-bybit-earn',
        accountName: 'Bybit Earn',
        accountKind: 'EXCHANGE_EARN',
        quantity: 0.12,
        avgBuyPrice: 42500,
        lockMeta: {
          kind: 'STAKING',
          apr: 5,
          lockEndDate: '2026-06-04T00:00:00.000Z',
          lockPeriod: '30-day lock',
        },
        tags: ['Speculative', 'Growth'],
      },
      {
        symbol: 'BTC',
        accountId: 'acc-bybit-spot',
        accountName: 'Bybit Spot',
        accountKind: 'EXCHANGE_SPOT',
        quantity: 0.05,
        avgBuyPrice: 45300,
        tags: ['Speculative', 'Trading'],
      },
      // --- USD cash on two accounts ---
      // Primary checking on Monobank (BANK) — the lion's share. Pre-M3
      // FX still missing, so we keep it nominally USD; once FxRateService
      // lands this becomes UAH and the bank chip shows ₴.
      {
        symbol: 'USD',
        accountId: 'acc-monobank',
        accountName: 'Monobank',
        accountKind: 'BANK_SAVINGS',
        quantity: 9895,
        avgBuyPrice: 1,
        tags: ['Emergency', 'Fixed income'],
      },
      // Manual cash dust — keeps W3 CASH bar split across two accounts
      // (Monobank ~91% / Manual ~9%) so the cross-tabulation widget has
      // something more interesting than a single full-width segment.
      {
        symbol: 'USD',
        accountId: MANUAL_ACCOUNT_ID,
        accountName: 'Manual cash',
        accountKind: 'MANUAL',
        quantity: 1000,
        avgBuyPrice: 1,
        tags: ['Emergency'],
      },
      // --- Apartment — single manual entry ---
      {
        symbol: 'KYIV-APT-1',
        accountId: MANUAL_ACCOUNT_ID,
        accountName: 'Manual',
        accountKind: 'MANUAL',
        quantity: 1,
        avgBuyPrice: 95000,
        tags: ['Long-term', 'Pension'],
      },
    ];

    // Materialise instruments once each, then build holdings against them.
    // Market-backed classes (STOCK / ETF / CRYPTO / TOKENIZED_STOCK) try the
    // backend search first so the resulting id matches the canonical catalog
    // entry and `/prices/batch` returns real quotes. Manual classes (CASH /
    // DEPOSIT / REAL_ESTATE / OTHER) and market-class fallback (server
    // offline, quota exhausted, no exact-symbol match) go through
    // `getOrCreate` with a client UUID — those holdings won't get live
    // prices but the rest of the seed still works.
    const seedCache = this.readSeedInstrumentCache();
    const instrumentBySymbol = new Map<string, IInstrument>();
    for (const spec of instruments) {
      const resolved = await this.resolveMarketInstrument(spec, seedCache);
      if (resolved) {
        this.instruments.addMarketInstruments([resolved]);
        instrumentBySymbol.set(spec.symbol, resolved);
        continue;
      }
      instrumentBySymbol.set(
        spec.symbol,
        this.instruments.getOrCreate({
          symbol: spec.symbol,
          assetClass: spec.assetClass,
          name: spec.name,
          currency: spec.currency,
          metadata: spec.metadata,
        }),
      );
    }
    this.persistSeedInstrumentCache(seedCache);

    const holdings: IHolding[] = [];
    for (const spec of holdingSpecs) {
      const instrument = instrumentBySymbol.get(spec.symbol);
      if (!instrument) {
        // Shouldn't happen — every holdingSpec.symbol has an instrumentSpec.
        // Skip defensively so a typo in the seed doesn't crash the app.
        continue;
      }
      const tagIds = spec.tags
        .map(tagId)
        .filter((id): id is string => !!id);
      holdings.push({
        id: uuid(),
        instrumentId: instrument.id,
        accountId: spec.accountId,
        accountName: spec.accountName,
        accountKind: spec.accountKind,
        ...(spec.lockMeta ? { lockMeta: spec.lockMeta } : {}),
        ...(spec.openedAt ? { openedAt: spec.openedAt } : {}),
        quantity: spec.quantity,
        averageBuyPrice: spec.avgBuyPrice,
        currency: instrument.currency,
        tagIds,
        createdAt: now,
        updatedAt: now,
      });
    }
    return holdings;
  }

  /**
   * Snapshot read of tags list, used during seed (where signals aren't
   * straightforward to access synchronously from a service constructor).
   */
  private readTagsSnapshot(): ITag[] {
    let snapshot: ITag[] = [];
    this.store$
      .pipe(select(selectTagsList))
      .subscribe((list) => {
        snapshot = list;
      })
      .unsubscribe();
    return snapshot;
  }

  /**
   * Resolve a market-backed seed instrument through
   * {@link InstrumentService.searchMarket}. Mutates `cache` in-place when
   * a fresh resolution succeeds so the caller can persist the full snapshot
   * after the loop. Returns `undefined` for manual classes and on any
   * failure path so the caller falls back to `getOrCreate`.
   */
  private async resolveMarketInstrument(
    spec: { symbol: string; assetClass: AssetClass },
    cache: Map<string, IInstrument>,
  ): Promise<IInstrument | undefined> {
    const key = HoldingService.seedCacheKey(spec.symbol, spec.assetClass);
    const cached = cache.get(key);
    if (cached) {
      return cached;
    }
    if (!isMarketBackedAssetClass(spec.assetClass)) {
      return undefined;
    }
    try {
      const res = await firstValueFrom(
        this.instruments.searchMarket(spec.symbol, spec.assetClass, 5),
      );
      // Prefer an exact symbol match (Alpha Vantage often returns related
      // tickers like AAPLU / AAPLW alongside AAPL). Fall back to first
      // result if the exact symbol isn't there — better a wrong-but-real
      // instrument than a client-UUID stub for the demo seed.
      const match =
        res.results.find((r) => r.symbol === spec.symbol) ?? res.results[0];
      if (match) {
        cache.set(key, match);
        return match;
      }
    } catch {
      // Network error / server offline / unexpected throw — caller falls
      // back to getOrCreate with a client UUID. The miss is silent on
      // purpose: seed is a dev-only convenience, not a user-facing flow.
    }
    return undefined;
  }

  private readSeedInstrumentCache(): Map<string, IInstrument> {
    const raw = localStorage.getItem(HoldingService.SEED_INSTRUMENTS_KEY);
    const map = new Map<string, IInstrument>();
    if (!raw) {
      return map;
    }
    try {
      const list = JSON.parse(raw) as IInstrument[];
      for (const inst of list) {
        map.set(HoldingService.seedCacheKey(inst.symbol, inst.assetClass), inst);
      }
    } catch {
      // Corrupted — start fresh, next successful resolution will overwrite.
    }
    return map;
  }

  private persistSeedInstrumentCache(cache: Map<string, IInstrument>): void {
    localStorage.setItem(
      HoldingService.SEED_INSTRUMENTS_KEY,
      JSON.stringify(Array.from(cache.values())),
    );
  }

  private static seedCacheKey(symbol: string, assetClass: AssetClass): string {
    return `${symbol}|${assetClass}`;
  }
}
