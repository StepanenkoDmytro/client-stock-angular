import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { AssetClass } from '../../../../../domain/asset-class.domain';
import { IHoldingView } from '../../../../../domain/holding.domain';
import {
  ILiability,
  liabilityTypeLabel,
} from '../../../../../domain/liability.domain';
import {
  ILoopPosition,
  loopEquityNow,
} from '../../../../../domain/loop-position.domain';
import { ITag } from '../../../../../domain/tag.domain';
import { LiabilitiesService } from '../../../../../service/liabilities.service';
import { LoopingService } from '../../../../../service/looping.service';
import {
  NetWorthBreakdown,
  computeNetWorth,
} from '../../../model/net-worth.helper';
import { HoldingService } from '../../../service/holding.service';
import { InstrumentService } from '../../../service/instrument.service';
import { LivePriceService } from '../../../service/live-price.service';
import { PortfolioOverviewService } from '../../../service/portfolio-overview.service';
import { TagsService } from '../../../service/tags.service';
import { UserPreferencesService } from '../../../service/user-preferences.service';
import { selectHoldingsList } from '../../../store/holdings.selectors';
import { selectTagsList } from '../../../store/tags.selectors';
import { FxRateService } from '../../../../../service/fx-rate.service';
import { CurrencySymbolPipe } from '../../../../../pipe/currency-symbol.pipe';
import { SUPPORTED_BASE_CURRENCIES } from '../../../../../domain/user-preferences.domain';

interface ClassBreakdown {
  assetClass: AssetClass;
  label: string;
  color: string;
  value: number;
  costBasis: number;
  pnl: number;
  pnlPercent: number;
  share: number;
}

/**
 * One slice of the allocation bar / legend. Asset classes plus a synthetic
 * "Strategies" slice (loop net equity, ADR-0013) — leverage never inflates
 * the pie because the slice is net equity, not gross collateral.
 */
interface AllocationSlice {
  key: string;
  label: string;
  color: string;
  value: number;
  share: number;
}

/**
 * PortfolioSummaryComponent — top-level summary card showing total
 * portfolio value, P&L, and per-class distribution.
 *
 * Lives outside any individual view (Classes / Holdings) — it's always
 * visible at the top of `/savings`. Internally it computes from the same
 * source signals as HoldingsListComponent/SavingsComponent (store +
 * InstrumentService + HoldingService.getCurrentPrice), so swapping views
 * doesn't cause the summary to be torn down and rebuilt.
 *
 * Self-contained: no inputs. Reads holdings + tags + instruments + mock
 * current prices on its own. When PriceFeedService (ADR-0003) lands in
 * M3, swap `holdings.getCurrentPrice` for `priceFeed.priceFor(symbol)`.
 */
@Component({
  selector: 'pgz-portfolio-summary',
  standalone: true,
  imports: [CommonModule, CurrencySymbolPipe],
  templateUrl: './portfolio-summary.component.html',
  styleUrl: './portfolio-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioSummaryComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly holdings = inject(HoldingService);
  private readonly instruments = inject(InstrumentService);
  private readonly livePrice = inject(LivePriceService);
  private readonly portfolioOverview = inject(PortfolioOverviewService);
  private readonly tags = inject(TagsService);
  private readonly userPrefs = inject(UserPreferencesService);
  private readonly fxRate = inject(FxRateService);
  private readonly liabilitiesService = inject(LiabilitiesService);
  private readonly loopingService = inject(LoopingService);

  private readonly rawHoldings = this.store.selectSignal(selectHoldingsList);
  private readonly rawTags = this.store.selectSignal(selectTagsList);

  private readonly liabilities = toSignal(this.liabilitiesService.getAll(), {
    initialValue: [] as ILiability[],
  });

  /** Looping positions (ADR-0013) — localStorage-backed, anonymous-safe. */
  private readonly loops = toSignal(this.loopingService.getAll(), {
    initialValue: [] as ILoopPosition[],
  });

  /**
   * Net equity of all loops in base currency (Σ `loopEquityNow`). Added to
   * owned assets for net worth and shown as the Strategies allocation slice.
   * Equity (collateral − debt + accrued), NOT gross collateral — so leverage
   * never double-counts against spot Crypto or the Liabilities band.
   */
  public readonly strategiesEquity = computed<number>(() => {
    const base = this.displayCurrency();
    const now = new Date();
    return this.loops().reduce(
      (sum, l) => sum + this.fxRate.toBase(loopEquityNow(l, now), l.currency, base),
      0,
    );
  });

  /** Expand/collapse for the net-worth breakdown (mockup savings/08). */
  private readonly _nwExpanded = signal<boolean>(false);
  public readonly nwExpanded = this._nwExpanded.asReadonly();

  public toggleNwExpanded(): void {
    this._nwExpanded.update((v) => !v);
  }

  private readonly holdingsView = computed<IHoldingView[]>(() => {
    const instrMap = this.instruments.instruments();
    const holdings = this.rawHoldings();
    const tags = this.rawTags();
    const tagsById = new Map(tags.map((t: ITag) => [t.id, t]));
    const result: IHoldingView[] = [];
    for (const h of holdings) {
      const instrument = instrMap.get(h.instrumentId);
      if (!instrument) {
        continue;
      }
      const resolvedTags = h.tagIds
        .map((id) => tagsById.get(id))
        .filter((t): t is ITag => !!t);
      result.push({ ...h, instrument, tags: resolvedTags });
    }
    return result;
  });

  /**
   * Phase 4 (M3 FX integration): backend-aggregated total + breakdown
   * in the user's `baseCurrency`. When `null` (anonymous, no auth, or
   * fetch error) the UI falls back to the local client-side aggregate
   * in {@link #summary}. `SavingsComponent` triggers the refresh on
   * `ngOnInit`; this component just consumes the cached signal.
   */
  public readonly backendOverview = this.portfolioOverview.latest;

  /**
   * Displayed total — prefer the backend FX-normalised value when
   * available so the user sees their portfolio in `baseCurrency`.
   * Fallback to the local sum (mixed currencies, no FX) for anonymous
   * mode and during the round-trip before the first overview arrives.
   */
  public readonly displayTotal = computed<number>(
    () => this.backendOverview()?.total ?? this.summary().totalValue,
  );

  /**
   * Display currency code. Order: backend FX-normalised overview (when
   * authenticated and loaded) → user's preference (covers anonymous mode
   * via localStorage fallback in {@link UserPreferencesService}) → `'USD'`.
   */
  public readonly displayCurrency = computed<string>(
    () =>
      this.backendOverview()?.baseCurrency
      ?? this.userPrefs.baseCurrency()
      ?? 'USD',
  );

  /**
   * Net worth = displayed assets − liabilities (ADR-0009 · L3). Liabilities
   * come from the localStorage `LiabilitiesService` (anonymous-safe).
   * `hasDebt` flips the headline to net worth; debt-free portfolios are
   * unchanged (zero-cost).
   */
  public readonly netWorth = computed<NetWorthBreakdown>(() => {
    const base = this.displayCurrency();
    // Owned assets = spot holdings + loop net equity (Strategies). Loops
    // contribute their equity to net worth (ADR-0013); the backend overview
    // doesn't know about anonymous loops, so we always add it client-side.
    const assets = this.displayTotal() + this.strategiesEquity();
    return computeNetWorth(assets, this.liabilities(), (amount, cur) =>
      this.fxRate.toBase(amount, cur, base),
    );
  });

  /**
   * Headline number — net worth when there's debt, else the (strategy-
   * inclusive) asset total. `assetsTotal` already folds in loop equity.
   */
  public readonly headlineValue = computed<number>(() => {
    const nw = this.netWorth();
    return nw.hasDebt ? nw.netWorth : nw.assetsTotal;
  });

  /**
   * Allocation slices for the bar + legend: asset classes (from holdings)
   * plus a Strategies slice (loop net equity) when any loop exists. Shares
   * are recomputed against the combined owned total so the bar sums to 100%.
   */
  public readonly allocation = computed<AllocationSlice[]>(() => {
    const strat = this.strategiesEquity();
    const classSlices = this.summary().breakdown;
    const combined = this.summary().totalValue + Math.max(0, strat);
    const slices: AllocationSlice[] = classSlices.map((s) => ({
      key: String(s.assetClass),
      label: s.label,
      color: s.color,
      value: s.value,
      share: combined > 0 ? s.value / combined : 0,
    }));
    if (strat > 0) {
      slices.push({
        key: 'strategies',
        label: 'Strategies',
        color: 'var(--strategy-loop)',
        value: strat,
        share: combined > 0 ? strat / combined : 0,
      });
    }
    return slices.sort((a, b) => b.value - a.value);
  });

  /** Per-debt rows for the expanded breakdown (base currency). */
  public readonly debtRows = computed<
    { key: string; name: string; amount: number }[]
  >(() => {
    const base = this.displayCurrency();
    return this.liabilities()
      .map((l) => ({
        key: `debt-${l.id ?? l.type}`,
        name: l.lender || l.notes || liabilityTypeLabel(l.type),
        amount: this.fxRate.toBase(l.principalBalance ?? 0, l.currency, base),
      }))
      .filter((d) => d.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  });

  public readonly summary = computed(() => {
    const all = this.holdingsView();
    // FX-normalise every value/cost into the user's baseCurrency.
    // For anonymous mode `userPrefs.baseCurrency()` reads from localStorage
    // (M3b anonymous-mode signal fallback); for authenticated users it
    // mirrors the server preference. When a rate isn't cached yet
    // (`convertSync` returns null — first render before preload lands),
    // we fall back to the raw native amount so the UI doesn't blank.
    const base = this.userPrefs.baseCurrency() ?? 'USD';
    /**
     * Live-prices doc §3 Rule 2:
     *  - `totalValue` mixes live prices and `averageBuyPrice` fallback so
     *     the dashboard shows a whole number (some part is "estimate from
     *     cost basis", silently).
     *  - `totalPnL` and `totalPnLPercent` only count the portion of the
     *     portfolio that has a real live price — otherwise unpriced
     *     holdings would force P&L to read as 0 / -100% and mislead.
     *  - `pricedValue` and `pricedCostBasis` are the inputs for the P&L
     *     computation; their delta is the P&L for the priced subset.
     */
    interface Bucket {
      value: number;          // mixed: live or cost-basis fallback
      costBasis: number;      // sum(quantity × avgBuyPrice) — every holding
      pricedValue: number;    // sum(quantity × livePrice) — priced subset
      pricedCostBasis: number; // sum(quantity × avgBuyPrice) — priced subset
    }
    const byClass = new Map<AssetClass, Bucket>();

    for (const h of all) {
      // Demo-mode parity with `SavingsComponent.classGroups`: route via
      // `holdings.getCurrentPrice(symbol)` so the dev-no-backend
      // dashboard sees the DEMO_FALLBACK_PRICES values as "priced".
      // Production still gets only the LivePriceService quote here.
      const priceFromService = this.holdings.getCurrentPrice(h.instrument.symbol);
      const effectivePrice = priceFromService ?? h.averageBuyPrice;
      const nativeValue = h.quantity * effectivePrice;
      const nativeCost = h.quantity * h.averageBuyPrice;
      // Convert per-holding so a multi-currency class (e.g. CASH with
      // USD + UAH + EUR sub-positions) sums correctly in the base.
      const value = this.fxRate.toBase(nativeValue, h.instrument.currency, base);
      const cost = this.fxRate.toBase(nativeCost, h.instrument.currency, base);
      const priced = priceFromService !== undefined;
      const existing = byClass.get(h.instrument.assetClass) ?? {
        value: 0,
        costBasis: 0,
        pricedValue: 0,
        pricedCostBasis: 0,
      };
      // value/cost already FX-converted via fxValue() above, so pricedValue
      // / pricedCostBasis carry the same base-currency scale.
      byClass.set(h.instrument.assetClass, {
        value: existing.value + value,
        costBasis: existing.costBasis + cost,
        pricedValue: existing.pricedValue + (priced ? value : 0),
        pricedCostBasis: existing.pricedCostBasis + (priced ? cost : 0),
      });
    }

    const totalValue = Array.from(byClass.values()).reduce(
      (s, c) => s + c.value,
      0,
    );
    const totalCost = Array.from(byClass.values()).reduce(
      (s, c) => s + c.costBasis,
      0,
    );
    const pricedValue = Array.from(byClass.values()).reduce(
      (s, c) => s + c.pricedValue,
      0,
    );
    const pricedCostBasis = Array.from(byClass.values()).reduce(
      (s, c) => s + c.pricedCostBasis,
      0,
    );
    const totalPnL = pricedValue - pricedCostBasis;
    const totalPnLPercent =
      pricedCostBasis > 0 ? (totalPnL / pricedCostBasis) * 100 : 0;

    const breakdown: ClassBreakdown[] = Array.from(byClass.entries())
      .map(([assetClass, b]) => ({
        assetClass,
        label: this.assetClassLabel(assetClass),
        color: this.assetClassBadgeColor(assetClass),
        value: b.value,
        costBasis: b.costBasis,
        pnl: b.pricedValue - b.pricedCostBasis,
        pnlPercent:
          b.pricedCostBasis > 0
            ? ((b.pricedValue - b.pricedCostBasis) / b.pricedCostBasis) * 100
            : 0,
        share: totalValue > 0 ? b.value / totalValue : 0,
      }))
      .sort((a, b) => b.value - a.value);

    return {
      totalValue,
      totalCost,
      totalPnL,
      totalPnLPercent,
      breakdown,
    };
  });

  ngOnInit(): void {
    this.tags.init();
    this.instruments.init();
    this.holdings.init();
    this.preloadFx();
  }

  /**
   * Preloads spot rates so the {@link summary} computed (which runs
   * synchronously) can resolve conversions instead of falling back to raw
   * amounts. We preload the full {@link SUPPORTED_BASE_CURRENCIES} set
   * against the base rather than only currencies currently held: holdings
   * load asynchronously, so reading `holdingsView()` here would often be
   * empty on the first tick and the preload would no-op. One small batch
   * request (≤8 pairs, cached for the session) sidesteps that race.
   */
  private preloadFx(): void {
    const base = this.userPrefs.baseCurrency() ?? 'USD';
    this.fxRate.preload(base, [...SUPPORTED_BASE_CURRENCIES]).subscribe();
  }

  // ---- helpers ----

  public abs(n: number): number {
    return Math.abs(n);
  }

  public formatNumber(value: number, fractionDigits = 0): string {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
  }

  public formatPercent(value: number, fractionDigits = 1): string {
    return (
      value.toLocaleString('en-US', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      }) + '%'
    );
  }

  public assetClassLabel(ac: AssetClass): string {
    switch (ac) {
      case AssetClass.STOCK:
        return 'Stock';
      case AssetClass.ETF:
        return 'ETF';
      case AssetClass.TOKENIZED_STOCK:
        return 'Tokenized stock';
      case AssetClass.CRYPTO:
        return 'Crypto';
      case AssetClass.CASH:
        return 'Cash';
      case AssetClass.DEPOSIT:
        return 'Deposit';
      case AssetClass.REAL_ESTATE:
        return 'Real estate';
      case AssetClass.OTHER:
        return 'Other';
    }
  }

  /** Theme-aware AssetClass colour (CSS var resolved in inline styles). */
  public assetClassBadgeColor(ac: AssetClass): string {
    switch (ac) {
      case AssetClass.STOCK:
        return 'var(--asset-stock)';
      case AssetClass.ETF:
        return 'var(--asset-etf, var(--asset-stock))';
      case AssetClass.TOKENIZED_STOCK:
        return 'var(--asset-tokenized-stock)';
      case AssetClass.CRYPTO:
        return 'var(--asset-crypto)';
      case AssetClass.CASH:
        return 'var(--asset-cash)';
      case AssetClass.DEPOSIT:
        return 'var(--asset-deposit)';
      case AssetClass.REAL_ESTATE:
        return 'var(--asset-real-estate)';
      case AssetClass.OTHER:
        return 'var(--asset-other)';
    }
  }
}
