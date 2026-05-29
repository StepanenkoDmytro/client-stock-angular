import { Injectable, Signal, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store, select } from '@ngrx/store';
import { firstValueFrom, map, timeout } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { IAccountV2 } from '../../domain/account-v2.domain';
import {
  AssetClass,
  isMarketBackedAssetClass,
} from '../../domain/asset-class.domain';
import { IHolding } from '../../domain/holding.domain';
import { IInstrument } from '../../domain/instrument.domain';
import { ITag } from '../../domain/tag.domain';
import { InstrumentService } from '../../pages/savings/service/instrument.service';
import { GoalsService } from '../../service/goals.service';
import { LiabilitiesService } from '../../service/liabilities.service';
import { loadAccounts } from '../../pages/savings/store/accounts.actions';
import { selectAccountsList } from '../../pages/savings/store/accounts.selectors';
import { loadHoldings } from '../../pages/savings/store/holdings.actions';
import { selectHoldingsList } from '../../pages/savings/store/holdings.selectors';
import { loadTags } from '../../pages/savings/store/tags.actions';
import { selectTagsList } from '../../pages/savings/store/tags.selectors';
import {
  DEMO_HOLDING_SPECS,
  DEMO_INSTRUMENT_SPECS,
  DemoInstrumentSpec,
  buildDemoAccountsWithFlag,
  buildDemoGoals,
  buildDemoLiabilities,
  createDemoSystemTags,
} from '../data/demo-fixtures';

/**
 * DemoDataService — single source of truth for the opt-in demo data
 * lifecycle introduced in
 * `docs/notes/2026-05-savings-empty-states-ladder.md` §6 PR1.
 *
 * <p>Replaces the three independent auto-seed paths that used to fire
 * from {@code HoldingService} / {@code AccountsService} / {@code TagsService}
 * on first launch in demo mode. Those services now bootstrap from cache /
 * backend only — the demo dataset lands in the stores exclusively through
 * {@link #seed} (called from the «Try with demo data» link in PR3 and
 * the «Restore demo» action in Profile in PR5).
 *
 * <p>Co-existence semantics per task §4.2:
 * <ul>
 *   <li>{@link #seed} APPENDS demo rows to the existing store contents —
 *       real entities the user already added stay untouched.</li>
 *   <li>{@link #clear} REMOVES only rows with {@code isDemo: true}; real
 *       entities survive.</li>
 *   <li>{@link #restore} is an alias for {@link #seed} with explicit
 *       logging — Profile «Restore demo» calls this.</li>
 * </ul>
 *
 * <p>All three methods are atomic from the user's perspective: each
 * dispatches one {@code loadXxx} action per slice carrying the next
 * full list, so the store reducers replace state in a single tick and
 * the localStorage subscription in each feature service writes the
 * merged snapshot once.
 */
@Injectable({ providedIn: 'root' })
export class DemoDataService {
  /**
   * Side cache for {@link DemoInstrumentSpec} resolutions through
   * `InstrumentService.searchMarket()`. Persisted to localStorage so a
   * subsequent {@link #restore} doesn't burn the Alpha Vantage 25 req/day
   * quota — same rationale as the pre-PR1 cache key that lived on
   * {@code HoldingService}. The key string is preserved verbatim so any
   * existing dev's resolutions carry over without a wipe.
   */
  private static readonly SEED_INSTRUMENTS_KEY =
    'holdings-seed-market-instruments';

  /**
   * Upper bound on a single `searchMarket()` call during demo
   * materialisation. Closes bug B3 per task §6 PR6 — a hung HTTP
   * request (offline backend, DNS failure, slow CDN) would otherwise
   * leave `firstValueFrom` awaiting forever and the demo seed would
   * never reach the `loadHoldings` dispatch. Set on the optimistic
   * side: live polling will catch up on its 30s tick once the network
   * recovers. 2500ms is comfortably above Alpha Vantage / CoinGecko
   * median latency yet short enough to feel responsive.
   */
  private static readonly SEARCH_MARKET_TIMEOUT_MS = 2500;

  private readonly store$ = inject(Store);
  private readonly instruments = inject(InstrumentService);
  private readonly goalsService = inject(GoalsService);
  private readonly liabilitiesService = inject(LiabilitiesService);

  private readonly demoHoldingsCount = toSignal(
    this.store$.pipe(
      select(selectHoldingsList),
      map((list) => list.filter((h) => h.isDemo === true).length),
    ),
    { initialValue: 0 },
  );

  private readonly demoAccountsCount = toSignal(
    this.store$.pipe(
      select(selectAccountsList),
      map((list) => list.filter((a) => a.isDemo === true).length),
    ),
    { initialValue: 0 },
  );

  private readonly demoTagsCount = toSignal(
    this.store$.pipe(
      select(selectTagsList),
      map((list) => list.filter((t) => t.isDemo === true).length),
    ),
    { initialValue: 0 },
  );

  /**
   * `true` whenever any store contains at least one row with
   * {@code isDemo: true}. Drives the persistent amber banner (PR5) and
   * the «Active · X items» badge on the Profile settings row (PR5).
   * Computed off three reactive counts so adding or clearing demo rows
   * flips the value without explicit notifications.
   */
  readonly isDemoActive: Signal<boolean> = computed(
    () =>
      this.demoHoldingsCount() > 0 ||
      this.demoAccountsCount() > 0 ||
      this.demoTagsCount() > 0,
  );

  /**
   * Total count of demo entities across all three slices. Feeds the
   * «Active · X items» badge on the Profile settings row (PR5). On a
   * fresh {@link #seed} this equals 10 holdings + 7 accounts + 12
   * system tags = 29.
   */
  readonly demoItemsCount: Signal<number> = computed(
    () =>
      this.demoHoldingsCount() +
      this.demoAccountsCount() +
      this.demoTagsCount(),
  );

  /**
   * Materialise the demo dataset and merge it into the three stores.
   *
   * <p>Order matters: tags first (so holding rows can look up tag IDs by
   * name), then accounts (so the join holdings × accounts has rows to
   * point at), then holdings (resolves market-backed instruments through
   * the InstrumentService).
   *
   * <p>Existing real entities are preserved — the new list dispatched
   * to each reducer is `[...real, ...demo]`. Idempotent on repeat: if
   * the store already contains demo rows (e.g. caller mistakenly calls
   * seed twice) the prior demo set is dropped first so we don't end up
   * with duplicates.
   */
  async seed(): Promise<void> {
    const demoAccounts = buildDemoAccountsWithFlag();
    const realAccounts = this.snapshotAccounts().filter((a) => a.isDemo !== true);
    this.store$.dispatch(
      loadAccounts({ state: { accountsList: [...realAccounts, ...demoAccounts] } }),
    );

    const demoTags = createDemoSystemTags();
    const realTags = this.snapshotTags().filter((t) => t.isDemo !== true);
    this.store$.dispatch(
      loadTags({ state: { tagsList: [...realTags, ...demoTags] } }),
    );

    const demoHoldings = await this.materializeDemoHoldings(demoTags);
    const realHoldings = this.snapshotHoldings().filter((h) => h.isDemo !== true);
    this.store$.dispatch(
      loadHoldings({ state: { holdingsList: [...realHoldings, ...demoHoldings] } }),
    );

    // Liabilities + goals live in localStorage services (not NgRx), so we
    // merge real (non-demo) rows with the demo set. Lights up the net-worth
    // headline, Liabilities band and debt-payoff goals (ADR-0009).
    this.liabilitiesService.replaceAll([
      ...this.liabilitiesService.snapshot().filter((l) => l.isDemo !== true),
      ...buildDemoLiabilities(),
    ]);
    this.goalsService.replaceAll([
      ...this.goalsService.snapshot().filter((g) => g.isDemo !== true),
      ...buildDemoGoals(),
    ]);
  }

  /**
   * Drop every row with {@code isDemo: true} across the three stores.
   * Real entities — anything {@code isDemo} is `undefined` or `false` —
   * remain. Called by the persistent banner CTA (PR5) and the Profile
   * «Clear demo data» action (PR5).
   */
  async clear(): Promise<void> {
    this.store$.dispatch(
      loadHoldings({
        state: {
          holdingsList: this.snapshotHoldings().filter((h) => h.isDemo !== true),
        },
      }),
    );
    this.store$.dispatch(
      loadAccounts({
        state: {
          accountsList: this.snapshotAccounts().filter((a) => a.isDemo !== true),
        },
      }),
    );
    this.store$.dispatch(
      loadTags({
        state: {
          tagsList: this.snapshotTags().filter((t) => t.isDemo !== true),
        },
      }),
    );
    this.liabilitiesService.replaceAll(
      this.liabilitiesService.snapshot().filter((l) => l.isDemo !== true),
    );
    this.goalsService.replaceAll(
      this.goalsService.snapshot().filter((g) => g.isDemo !== true),
    );
  }

  /**
   * Alias for {@link #seed} — Profile «Restore demo» wires through this
   * so logs distinguish a deliberate restore from the first opt-in.
   * Behaviour-identical: appends a fresh demo set to whatever is already
   * in the stores.
   */
  async restore(): Promise<void> {
    return this.seed();
  }

  // ---- internal -----------------------------------------------------

  /**
   * Sync snapshot reads. NgRx selectors are observables, but at the
   * point we mutate the demo dataset we need the current value to
   * compute the merge. Mirrors the {@code readTagsSnapshot} pattern
   * used by the pre-PR1 {@code HoldingService.seedMockHoldings}.
   */
  private snapshotHoldings(): IHolding[] {
    let snapshot: IHolding[] = [];
    this.store$.pipe(select(selectHoldingsList))
      .subscribe((list) => { snapshot = list; })
      .unsubscribe();
    return snapshot;
  }

  private snapshotAccounts(): IAccountV2[] {
    let snapshot: IAccountV2[] = [];
    this.store$.pipe(select(selectAccountsList))
      .subscribe((list) => { snapshot = list; })
      .unsubscribe();
    return snapshot;
  }

  private snapshotTags(): ITag[] {
    let snapshot: ITag[] = [];
    this.store$.pipe(select(selectTagsList))
      .subscribe((list) => { snapshot = list; })
      .unsubscribe();
    return snapshot;
  }

  /**
   * Resolve every {@link DEMO_INSTRUMENT_SPECS} entry to a real
   * {@link IInstrument} (catalog match for market-backed classes, client
   * UUID fallback for everything else), then build the 9 demo holdings
   * against them. Tag lookup uses the snapshot of seeded demo tags so
   * the assignments are deterministic even if the user has user-created
   * tags with colliding names.
   */
  private async materializeDemoHoldings(demoTags: ITag[]): Promise<IHolding[]> {
    const now = new Date().toISOString();
    const tagId = (name: string): string | undefined =>
      demoTags.find((t) => t.name === name && t.system)?.id;

    const seedCache = this.readSeedInstrumentCache();
    const instrumentBySymbol = new Map<string, IInstrument>();
    for (const spec of DEMO_INSTRUMENT_SPECS) {
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
    for (const spec of DEMO_HOLDING_SPECS) {
      const instrument = instrumentBySymbol.get(spec.symbol);
      if (!instrument) continue;
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
        isDemo: true,
      });
    }
    return holdings;
  }

  /**
   * Catalog lookup through {@link InstrumentService#searchMarket}. Exact
   * symbol match wins — no fallback to {@code results[0]} per the
   * pre-PR1 v5 rationale (a wrong-but-real instrument means the backend
   * returns a real price for the wrong thing, which is worse than no
   * live price at all). Mutates {@code cache} on success so the caller
   * can persist a full snapshot after the loop.
   */
  private async resolveMarketInstrument(
    spec: DemoInstrumentSpec,
    cache: Map<string, IInstrument>,
  ): Promise<IInstrument | undefined> {
    const key = DemoDataService.seedCacheKey(spec.symbol, spec.assetClass);
    const cached = cache.get(key);
    if (cached) return cached;
    if (!isMarketBackedAssetClass(spec.assetClass)) return undefined;
    try {
      // limit=30 — CoinGecko search buries Bitcoin (`symbol="BTC"`,
      // `coingeckoId="bitcoin"`) behind ~20 derived tokens; limit=5
      // missed it and the seed fell back to a client UUID, breaking
      // live polling. See pre-PR1 v5 note on HoldingService.SEED_VERSION.
      const res = await firstValueFrom(
        this.instruments
          .searchMarket(spec.symbol, spec.assetClass, 30)
          .pipe(timeout(DemoDataService.SEARCH_MARKET_TIMEOUT_MS)),
      );
      const want = spec.symbol.toUpperCase();
      const match = res.results.find((r) => r.symbol.toUpperCase() === want);
      if (match) {
        cache.set(key, match);
        return match;
      }
    } catch {
      // Server offline / quota exhausted / network / timeout — caller
      // falls back to getOrCreate with a client UUID and
      // DEMO_FALLBACK_PRICES picks up the display value. Closes B3:
      // before the `timeout()` operator above, an offline backend
      // would hang the demo seed forever and the user would never see
      // the fallback fixtures.
    }
    return undefined;
  }

  private readSeedInstrumentCache(): Map<string, IInstrument> {
    const raw = localStorage.getItem(DemoDataService.SEED_INSTRUMENTS_KEY);
    const map = new Map<string, IInstrument>();
    if (!raw) return map;
    try {
      const list = JSON.parse(raw) as IInstrument[];
      for (const inst of list) {
        map.set(DemoDataService.seedCacheKey(inst.symbol, inst.assetClass), inst);
      }
    } catch {
      // Corrupted — start fresh; next successful resolution overwrites.
    }
    return map;
  }

  private persistSeedInstrumentCache(cache: Map<string, IInstrument>): void {
    localStorage.setItem(
      DemoDataService.SEED_INSTRUMENTS_KEY,
      JSON.stringify(Array.from(cache.values())),
    );
  }

  private static seedCacheKey(symbol: string, assetClass: AssetClass): string {
    return `${symbol}|${assetClass}`;
  }
}
