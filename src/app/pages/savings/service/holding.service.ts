import { Injectable, inject } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Observable, filter } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { AssetClass } from '../../../domain/asset-class.domain';
import { IHolding } from '../../../domain/holding.domain';
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
import { InstrumentService } from './instrument.service';
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

  private readonly store$ = inject(Store<{ holdings: IHoldingsState }>);
  private readonly instruments = inject(InstrumentService);
  private readonly tags = inject(TagsService);

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
   * Mock "current market price" lookup. Returns a hardcoded value for the
   * 5 demo holdings, undefined otherwise. Stands in for the future
   * `PriceFeedService` (ADR-0003) until the real market integration lands.
   *
   * Prices chosen to produce a realistic mixed P&L picture for the demo
   * (stocks up, crypto up, real estate up, cash flat).
   */
  getCurrentPrice(symbol: string): number | undefined {
    return HoldingService.MOCK_CURRENT_PRICES[symbol];
  }

  /**
   * Internal lookup table for the demo. Keys match the seeded mock
   * instrument symbols; values are "as-of today" prices.
   */
  private static readonly MOCK_CURRENT_PRICES: Record<string, number> = {
    AAPL: 175.0,
    MSFT: 410.0,
    BTC: 58000.0,
    USD: 1.0,
    'KYIV-APT-1': 110000.0,
  };

  resetDemoData(): void {
    localStorage.removeItem(HoldingService.STORAGE_KEY);
    // Force the instrument cache back to empty so getOrCreate produces
    // brand-new IDs for the mock instruments; otherwise stale ones from
    // the in-memory cache would be reused.
    this.instruments.reset();
    const seeded = this.seedMockHoldings();
    this.store$.dispatch(
      loadHoldings({ state: { holdingsList: seeded } }),
    );
  }

  // -- internal --

  private bootstrap(forceReload = false): void {
    const raw = localStorage.getItem(HoldingService.STORAGE_KEY);
    if (raw) {
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

    // Missing or empty snapshot — seed demo holdings.
    const seeded = this.seedMockHoldings();
    this.store$.dispatch(
      loadHoldings({ state: { holdingsList: seeded } }),
    );
  }

  /**
   * Generates 5 example holdings that span the AssetClass enum and tag
   * them with system tags. Pure side-effect-aware: creates instruments
   * via InstrumentService.getOrCreate (which persists them to
   * 'custom-instruments') and reads tags by name from the tags store.
   */
  private seedMockHoldings(): IHolding[] {
    const now = new Date().toISOString();
    const allTags = this.readTagsSnapshot();
    const tagId = (name: string): string | undefined =>
      allTags.find((t) => t.name === name && t.system)?.id;

    const specs: Array<{
      symbol: string;
      assetClass: AssetClass;
      name: string;
      currency: string;
      metadata: IInstrument['metadata'];
      quantity: number;
      avgBuyPrice: number;
      tags: string[];
    }> = [
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
        quantity: 12,
        avgBuyPrice: 152.4,
        tags: ['Long-term', 'Dividend', 'Pension'],
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
        quantity: 8,
        avgBuyPrice: 310,
        tags: ['Long-term', 'Growth', 'Pension'],
      },
      {
        symbol: 'BTC',
        assetClass: AssetClass.CRYPTO,
        name: 'Bitcoin',
        currency: 'USD',
        metadata: { kind: AssetClass.CRYPTO, coinId: 'bitcoin' },
        quantity: 0.45,
        avgBuyPrice: 41200,
        tags: ['Speculative', 'Growth', 'Trading'],
      },
      {
        // Pre-M3 (no FxRateService): keep cash in USD so portfolio summary
        // aggregates cleanly. When FX lands we'll add UAH/EUR/PLN variants.
        symbol: 'USD',
        assetClass: AssetClass.CASH,
        name: 'USD Cash',
        currency: 'USD',
        metadata: { kind: AssetClass.CASH, currency: 'USD' },
        quantity: 5000,
        avgBuyPrice: 1,
        tags: ['Emergency', 'Fixed income'],
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
        quantity: 1,
        avgBuyPrice: 95000,
        tags: ['Long-term', 'Pension'],
      },
    ];

    const holdings: IHolding[] = [];
    for (const spec of specs) {
      const instrument = this.instruments.getOrCreate({
        symbol: spec.symbol,
        assetClass: spec.assetClass,
        name: spec.name,
        currency: spec.currency,
        metadata: spec.metadata,
      });
      const tagIds = spec.tags
        .map(tagId)
        .filter((id): id is string => !!id);
      holdings.push({
        id: uuid(),
        instrumentId: instrument.id,
        accountId: MANUAL_ACCOUNT_ID,
        quantity: spec.quantity,
        averageBuyPrice: spec.avgBuyPrice,
        currency: spec.currency,
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
