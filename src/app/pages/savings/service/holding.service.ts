import { Injectable, inject } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Observable, filter } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { AccountKind } from '../../../domain/account-kind.domain';
import { AssetClass } from '../../../domain/asset-class.domain';
import { IHolding, IHoldingLockMeta } from '../../../domain/holding.domain';
import { IInstrument } from '../../../domain/instrument.domain';
import { ITag } from '../../../domain/tag.domain';
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
  HoldingApiService,
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
   * Bumps every time the mock-seed shape or contents change in a way that
   * makes the *previous* seed look wrong against the *current* UI. The
   * bootstrap path compares this with the value cached in localStorage —
   * mismatch wipes the snapshot and re-seeds so dev users automatically
   * pick up new fixtures without remembering to press "Reset demo data".
   *
   *  v1: original five holdings, one per instrument, all MANUAL account.
   *  v2: PR6 — adds accountKind, lockMeta, openedAt; BTC×3, AAPL×2,
   *      AAPL.X×1 multi-location seed.
   *
   * Goes away when M5 wires real backend data — seed disappears with it.
   */
  private static readonly SEED_VERSION = 2;

  private readonly store$ = inject(Store<{ holdings: IHoldingsState }>);
  private readonly instruments = inject(InstrumentService);
  private readonly livePrice = inject(LivePriceService);
  private readonly tags = inject(TagsService);
  private readonly api = inject(HoldingApiService);

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

  addHolding(holding: IHolding): void {
    this.store$.dispatch(addHolding({ holding }));
  }

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
   * Pure edit — patches non-null fields on the server and mirrors the
   * change into the local store. Avg-price is NOT recomputed; use
   * {@link #topUp} for that. Fire-and-forget; HTTP errors are swallowed
   * for now (local optimism wins until proper effects land).
   */
  update(id: string, body: HoldingUpdateRequest): void {
    this.store$.dispatch(
      editHolding({
        id,
        addQuantity: 0,
        addPrice: 0,
        patch: this.toLocalPatch(body),
      }),
    );
    this.api.update(id, body).subscribe({ error: () => {} });
  }

  /**
   * Top-up — recomputes weighted-average buy price per ADR-0001 on both
   * the server and the local store. Fire-and-forget; HTTP errors swallowed.
   */
  topUp(id: string, body: HoldingTopUpRequest): void {
    this.store$.dispatch(
      editHolding({
        id,
        addQuantity: body.addQuantity,
        addPrice: body.addBuyPrice,
        patch: {},
      }),
    );
    this.api.topUp(id, body).subscribe({ error: () => {} });
  }

  private toLocalPatch(body: HoldingUpdateRequest): Partial<IHolding> {
    const patch: Partial<IHolding> = {};
    if (body.quantity !== undefined) patch.quantity = body.quantity;
    if (body.averageBuyPrice !== undefined) patch.averageBuyPrice = body.averageBuyPrice;
    if (body.currency !== undefined) patch.currency = body.currency;
    return patch;
  }

  deleteHolding(id: string): void {
    this.store$.dispatch(deleteHolding({ id }));
  }

  assignTags(holdingId: string, tagIds: string[]): void {
    this.store$.dispatch(assignTags({ holdingId, tagIds }));
  }

  /**
   * Public reset for the holdings-list screen. Wipes the holdings
   * snapshot from localStorage (and the user-instruments side-cache
   * so re-seed creates them fresh), then re-runs the seed path.
   * Used by the "Reset demo data" button on `/savings/holdings`.
   */
  /**
   * Current market price for a symbol. Resolution order (PR-A4 / ADR-0003):
   *
   *   1. {@link LivePriceService} — live polled value from the backend
   *      `/api/v1/prices/batch` endpoint, refreshed every 30s once the
   *      caller has invoked `livePrice.init()`. This is the canonical
   *      path for instruments that exist in the backend catalog.
   *   2. {@link HoldingService.MOCK_CURRENT_PRICES} — hardcoded fallback
   *      for the demo seed (whose instruments have client-side UUIDs that
   *      don't match anything in the backend DB). Goes away once the
   *      seed itself is removed (post-M5).
   */
  getCurrentPrice(symbol: string): number | undefined {
    const live = this.livePrice.getCurrentPriceBySymbol(symbol);
    if (live !== undefined) {
      return live;
    }
    return HoldingService.MOCK_CURRENT_PRICES[symbol];
  }

  /**
   * Demo-only fallback prices for the seeded mock holdings. Used when
   * the live price feed has no data for a symbol (typical for the
   * client-side UUID seed which doesn't exist server-side).
   */
  private static readonly MOCK_CURRENT_PRICES: Record<string, number> = {
    AAPL: 175.0,
    'AAPL.X': 176.0,
    MSFT: 410.0,
    BTC: 58000.0,
    USD: 1.0,
    'KYIV-APT-1': 110000.0,
  };

  resetDemoData(): void {
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
    // This keeps dev users on the latest demo fixtures without making
    // them press "Reset demo data" manually whenever the seed evolves.
    const seedOutdated = cachedVersion !== HoldingService.SEED_VERSION;

    if (raw && !seedOutdated) {
      try {
        const state = JSON.parse(raw) as IHoldingsState;
        if (state.holdingsList && state.holdingsList.length > 0) {
          this.store$.dispatch(loadHoldings({ state }));
          return;
        }
        // Empty snapshot — fall through to re-seed (demo phase).
      } catch {
        // Corrupted — fall through to seed.
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

    // Missing, empty, or outdated snapshot — seed demo holdings.
    this.runSeed();
  }

  /**
   * Materialises the demo seed and persists the seed version so the next
   * bootstrap doesn't re-trigger the migration path.
   */
  private runSeed(): void {
    const seeded = this.seedMockHoldings();
    this.store$.dispatch(
      loadHoldings({ state: { holdingsList: seeded } }),
    );
    localStorage.setItem(
      HoldingService.SEED_VERSION_KEY,
      String(HoldingService.SEED_VERSION),
    );
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
   * The seed creates Instruments via `InstrumentService.getOrCreate` (which
   * caches by symbol+class so repeated calls for the same symbol return
   * the same Instrument). Tags resolved by name against the snapshot
   * captured at seed-time. Each holding carries `accountKind`/`accountName`
   * directly — heuristic inference (ADR-0001) waits for the real Account
   * model in M2.
   */
  private seedMockHoldings(): IHolding[] {
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
      // --- USD cash — single bucket ---
      {
        symbol: 'USD',
        accountId: MANUAL_ACCOUNT_ID,
        accountName: 'Manual cash',
        accountKind: 'MANUAL',
        quantity: 5000,
        avgBuyPrice: 1,
        tags: ['Emergency', 'Fixed income'],
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
    const instrumentBySymbol = new Map<string, IInstrument>();
    for (const spec of instruments) {
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
}
