import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { AssetClass } from '../../domain/asset-class.domain';
import { IHoldingView } from '../../domain/holding.domain';
import { IPosition } from '../../domain/position.domain';
import { ITag } from '../../domain/tag.domain';
import { ButtonToggleComponent } from '../../core/UI/components/button-toggle/button-toggle.component';
import { SegmentedToggleComponent } from '../../core/UI/components/segmented-toggle/segmented-toggle.component';
import { SelectMarketDialogComponent } from './components/select-market-dialog/select-market-dialog.component';
import { HoldingsListComponent } from './components/holdings/holdings-list.component';
// PR5c: kpi-row and wealth-chart-mini imports removed — they remain in the
// codebase under `components/holdings/{kpi-row,wealth-chart-mini}/` for the
// future /analytics screen (M5+) but are no longer rendered on /savings.
import { PortfolioSummaryComponent } from './components/holdings/portfolio-summary/portfolio-summary.component';
import { PositionCardComponent } from './components/positions/position-card/position-card.component';
import { AccountsService } from './service/accounts.service';
import { HoldingService } from './service/holding.service';
import { InstrumentService } from './service/instrument.service';
import { LivePriceService } from './service/live-price.service';
import { MarketStatusService } from './service/market-status.service';
import { PositionsService } from './service/positions.service';
import { TagsService } from './service/tags.service';
import { UserPreferencesService } from './service/user-preferences.service';
import { AddTriggerService } from '../../service/helpers/add-trigger.service';
import { selectHoldingsList } from './store/holdings.selectors';
import { selectTagsList } from './store/tags.selectors';

type SavingsView = 'classes' | 'holdings';

/**
 * Header date format: "Saturday · May 16, 2026"
 * Mockup reference: design/savings/00-mobile-shell-baseline.svg
 */
function formatHeaderDate(d: Date = new Date()): string {
  const parts = d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  // Intl uses ", " between weekday and rest; mockup uses " · " separator.
  return parts.replace(', ', ' · ');
}

interface ClassGroup {
  assetClass: AssetClass;
  label: string;
  color: string;
  holdings: IHoldingView[];        // all holdings in this class, sorted desc by current value
  positions: IPosition[];          // holdings re-bucketed per Instrument, sorted desc by totalValue
  visiblePositions: IPosition[];   // first VISIBLE_PER_CLASS positions
  hiddenPositionCount: number;     // positions.length - VISIBLE_PER_CLASS, or 0
  totalCount: number;              // total number of underlying holdings (for "Show all N" copy)
  totalValue: number;              // current market value
  costBasis: number;               // sum of quantity × avgBuyPrice
  pnl: number;                     // totalValue - costBasis
  pnlPercent: number;              // (pnl / costBasis) * 100, 0 when costBasis = 0
  share: number;                   // value as fraction of portfolio (0..1)
}

const VISIBLE_PER_CLASS = 5;

const UI_COMPONENTS = [
  ButtonToggleComponent,
  SegmentedToggleComponent,
  PositionCardComponent,
  HoldingsListComponent,
  PortfolioSummaryComponent,
];

const MATERIAL_MODULES = [
  MatIconModule,
  MatChipsModule,
  MatButtonModule,
  MatBottomSheetModule,
  MatExpansionModule,
  MatTooltipModule,
  MatFormFieldModule,
];

@Component({
  selector: 'pgz-savings',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ...UI_COMPONENTS,
    ...MATERIAL_MODULES,
  ],
  templateUrl: './savings.component.html',
  styleUrl: './savings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SavingsComponent implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly store = inject(Store);
  private readonly destroyRef = inject(DestroyRef);
  private readonly addTriggerService = inject(AddTriggerService);
  private readonly holdings = inject(HoldingService);
  private readonly instruments = inject(InstrumentService);
  private readonly livePrice = inject(LivePriceService);
  private readonly marketStatus = inject(MarketStatusService);
  private readonly positionsSvc = inject(PositionsService);
  private readonly tags = inject(TagsService);
  private readonly accounts = inject(AccountsService);
  private readonly userPrefs = inject(UserPreferencesService);

  /**
   * View toggle state.
   *  - 'classes': portfolio-by-class accordion (this component).
   *  - 'holdings': flat list (HoldingsListComponent embedded with no header).
   *
   * Mapping to pgz-button-toggle (matches the goals page pattern):
   *  - dataUnchecked='Classes' → emits `true`  → view='classes' (initial).
   *  - dataChecked='Holdings'  → emits `false` → view='holdings'.
   */
  public readonly view = signal<SavingsView>('classes');

  /**
   * Header date — computed once at component creation. We're rendering a
   * dashboard, not a real-time clock, so daily granularity is enough; no
   * need for an interval ticker.
   */
  public readonly todayLabel = formatHeaderDate();

  /**
   * Hide-balance toggle — visual stub for PR1. Real privacy feature lands
   * in a follow-up (see portfolio-screen-plan §5 Open Question 2).
   */
  public readonly hideBalances = signal(false);

  /**
   * When the user clicks "Show all N" on a class accordion, we set this
   * to the target AssetClass before flipping the view. HoldingsListComponent
   * reads it via @Input and pre-applies the class filter on mount.
   *
   * Reset to null after the holdings view is entered to avoid re-applying
   * the filter if the user manually clears it inside Holdings.
   */
  public readonly initialHoldingsClass = signal<AssetClass | null>(null);

  // ---- Store signals (one selectSignal per source, at field init) ----
  private readonly rawHoldings = this.store.selectSignal(selectHoldingsList);
  private readonly rawTags = this.store.selectSignal(selectTagsList);

  /** Joined IHoldingView projection. Same join logic as in HoldingsListComponent. */
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
   * Group holdings by AssetClass. Sort classes by total value desc; within
   * each class, sort holdings by their current value desc so the top-5
   * cards represent the user's largest positions.
   */
  public readonly classGroups = computed<ClassGroup[]>(() => {
    const all = this.holdingsView();
    if (all.length === 0) {
      return [];
    }

    // Bucket holdings by AssetClass with per-holding current + cost values.
    interface Row {
      h: IHoldingView;
      currentValue: number;
      cost: number;
    }
    const buckets = new Map<AssetClass, Row[]>();
    for (const h of all) {
      const currentPrice =
        this.holdings.getCurrentPrice(h.instrument.symbol) ??
        h.averageBuyPrice;
      const currentValue = h.quantity * currentPrice;
      const cost = h.quantity * h.averageBuyPrice;
      const list = buckets.get(h.instrument.assetClass) ?? [];
      list.push({ h, currentValue, cost });
      buckets.set(h.instrument.assetClass, list);
    }

    const totalPortfolioValue = Array.from(buckets.values()).reduce(
      (sum, list) => sum + list.reduce((s, x) => s + x.currentValue, 0),
      0,
    );

    const priceFor = (symbol: string): number | undefined =>
      this.holdings.getCurrentPrice(symbol);

    const groups: ClassGroup[] = [];
    for (const [assetClass, list] of buckets.entries()) {
      list.sort((a, b) => b.currentValue - a.currentValue);
      const holdings = list.map((x) => x.h);
      const totalValue = list.reduce((s, x) => s + x.currentValue, 0);
      const costBasis = list.reduce((s, x) => s + x.cost, 0);
      const pnl = totalValue - costBasis;
      const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
      // PositionsService re-buckets holdings per Instrument so two BTC
      // holdings (cold wallet + earn) collapse into a single Position card.
      const positions = this.positionsSvc.fromHoldings(holdings, priceFor);
      const visiblePositions = positions.slice(0, VISIBLE_PER_CLASS);
      const hiddenPositionCount = Math.max(
        0,
        positions.length - VISIBLE_PER_CLASS,
      );

      groups.push({
        assetClass,
        label: this.assetClassLabel(assetClass),
        color: this.assetClassBadgeColor(assetClass),
        holdings,
        positions,
        visiblePositions,
        hiddenPositionCount,
        totalCount: holdings.length,
        totalValue,
        costBasis,
        pnl,
        pnlPercent,
        share: totalPortfolioValue > 0 ? totalValue / totalPortfolioValue : 0,
      });
    }

    groups.sort((a, b) => b.totalValue - a.totalValue);
    return groups;
  });

  ngOnInit(): void {
    // Bootstrap all three feature services. Order matters: tags first
    // (so HoldingService.seedMockHoldings can read system tag IDs by name),
    // then instruments, then holdings.
    this.tags.init();
    this.accounts.init();
    this.instruments.init();
    this.holdings.init();
    // Market status comes up first so the live-price service can read
    // it on its very first tick (skip closed venues from polling).
    this.marketStatus.init();
    // Start live-price polling. Tracked instrument-id set is derived
    // from the NgRx holdings signal, so it automatically follows
    // add/edit/delete of holdings without any extra plumbing here.
    this.livePrice.init();
    // Bootstrap user-preferences (baseCurrency etc.). Single fire — the
    // service caches as a signal so subsequent components read straight
    // from `userPrefs.baseCurrency()` without their own HTTP. Errors
    // (no auth, network) leave the cached value at null; UI continues
    // using its local default until a successful login.
    this.userPrefs.load()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();

    this.addTriggerService.buttonClick$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((path) => {
        if (path === '/savings') {
          // The + FAB now lands on the universal Add Holding form. The
          // legacy SelectMarketDialog (stock-asset / crypto-asset routes)
          // stays in the codebase as a fallback until M6 deletes it
          // entirely — those routes remain reachable by URL but no longer
          // accessible from the bottom nav.
          this.router.navigate(['/savings/add-holding']);
          this.addTriggerService.resetButtonClick();
        }
      });
  }

  /**
   * Handler for pgz-segmented-toggle — emits the selected label.
   * Map 'Classes' → 'classes', 'Holdings' → 'holdings'.
   */
  public onViewToggle(label: string): void {
    const next: SavingsView = label === 'Holdings' ? 'holdings' : 'classes';
    this.view.set(next);
    if (next === 'classes') {
      // Leaving Holdings — clear pending filter so next entry starts fresh
      // unless user clicks "Show all N" again.
      this.initialHoldingsClass.set(null);
    }
  }

  public viewLabel(): string {
    return this.view() === 'classes' ? 'Classes' : 'Holdings';
  }

  /**
   * "Show all N" handler on a class accordion. Pre-sets the filter and
   * flips the view to Holdings; HoldingsListComponent applies the filter
   * via its `initialClassFilter` @Input on mount.
   */
  public goToHoldings(assetClass: AssetClass): void {
    this.initialHoldingsClass.set(assetClass);
    this.view.set('holdings');
  }

  public openTagsManage(): void {
    this.router.navigate(['/savings/tags']);
  }

  public openAccountsManage(): void {
    this.router.navigate(['/savings/accounts']);
  }

  // ---- Legacy FAB-driven Add flow (until PR5 ships the new Add Holding form) ----

  public openSelectedFilter(): void {
    const dialogRef = this.dialog.open(SelectMarketDialogComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.router.navigate(['savings/', result.toLocaleLowerCase()]);
      }
    });
  }

  // ---- Display helpers ----

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

  /**
   * Returns the AssetClass color as a CSS variable reference. Concrete hex
   * values live in `styles.scss` per theme (light + dark), so this colour
   * adapts automatically when the user switches theme.
   *
   * The browser resolves `var(...)` in inline `style` attributes, so this
   * works seamlessly via `[style.background-color]="assetClassBadgeColor(ac)"`.
   */
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
}
