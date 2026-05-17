import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
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
import { ITag } from '../../domain/tag.domain';
import { ButtonToggleComponent } from '../../core/UI/components/button-toggle/button-toggle.component';
import { SelectMarketDialogComponent } from './components/select-market-dialog/select-market-dialog.component';
import { HoldingCardComponent } from './components/holdings/holding-card/holding-card.component';
import { HoldingsListComponent } from './components/holdings/holdings-list.component';
import { PortfolioSummaryComponent } from './components/holdings/portfolio-summary/portfolio-summary.component';
import { HoldingService } from './service/holding.service';
import { InstrumentService } from './service/instrument.service';
import { TagsService } from './service/tags.service';
import { AddTriggerService } from '../../service/helpers/add-trigger.service';
import { selectHoldingsList } from './store/holdings.selectors';
import { selectTagsList } from './store/tags.selectors';

type SavingsView = 'classes' | 'holdings';

interface ClassGroup {
  assetClass: AssetClass;
  label: string;
  color: string;
  holdings: IHoldingView[];        // all holdings in this class, sorted desc by current value
  visibleHoldings: IHoldingView[]; // first VISIBLE_PER_CLASS items
  hiddenCount: number;             // holdings.length - VISIBLE_PER_CLASS, or 0
  totalCount: number;
  totalValue: number;              // current market value
  share: number;                   // value as fraction of portfolio (0..1)
}

const VISIBLE_PER_CLASS = 5;

const UI_COMPONENTS = [
  ButtonToggleComponent,
  HoldingCardComponent,
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
  private readonly addTriggerService = inject(AddTriggerService);
  private readonly holdings = inject(HoldingService);
  private readonly instruments = inject(InstrumentService);
  private readonly tags = inject(TagsService);

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

    // Bucket holdings by AssetClass and compute per-holding current value.
    const buckets = new Map<
      AssetClass,
      Array<{ h: IHoldingView; currentValue: number }>
    >();
    for (const h of all) {
      const currentPrice =
        this.holdings.getCurrentPrice(h.instrument.symbol) ??
        h.averageBuyPrice;
      const currentValue = h.quantity * currentPrice;
      const list =
        buckets.get(h.instrument.assetClass) ??
        ([] as Array<{ h: IHoldingView; currentValue: number }>);
      list.push({ h, currentValue });
      buckets.set(h.instrument.assetClass, list);
    }

    const totalPortfolioValue = Array.from(buckets.values()).reduce(
      (sum, list) => sum + list.reduce((s, x) => s + x.currentValue, 0),
      0,
    );

    const groups: ClassGroup[] = [];
    for (const [assetClass, list] of buckets.entries()) {
      list.sort((a, b) => b.currentValue - a.currentValue);
      const holdings = list.map((x) => x.h);
      const totalValue = list.reduce((s, x) => s + x.currentValue, 0);
      const visibleHoldings = holdings.slice(0, VISIBLE_PER_CLASS);
      const hiddenCount = Math.max(0, holdings.length - VISIBLE_PER_CLASS);

      groups.push({
        assetClass,
        label: this.assetClassLabel(assetClass),
        color: this.assetClassBadgeColor(assetClass),
        holdings,
        visibleHoldings,
        hiddenCount,
        totalCount: holdings.length,
        totalValue,
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
    this.instruments.init();
    this.holdings.init();

    this.addTriggerService.buttonClick$.subscribe((path) => {
      if (path === '/savings') {
        this.openSelectedFilter();
        this.addTriggerService.resetButtonClick();
      }
    });
  }

  /** Handler for pgz-button-toggle (see field doc above). */
  public onViewToggle(isUnchecked: boolean): void {
    this.view.set(isUnchecked ? 'classes' : 'holdings');
    if (this.view() === 'classes') {
      // Leaving Holdings — clear pending filter so next entry starts fresh
      // unless user clicks "Show all N" again.
      this.initialHoldingsClass.set(null);
    }
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

  public assetClassBadgeColor(ac: AssetClass): string {
    switch (ac) {
      case AssetClass.STOCK:
        return '#1976D2';
      case AssetClass.TOKENIZED_STOCK:
        return '#7B1FA2';
      case AssetClass.CRYPTO:
        return '#F57C00';
      case AssetClass.CASH:
        return '#388E3C';
      case AssetClass.DEPOSIT:
        return '#5D4037';
      case AssetClass.REAL_ESTATE:
        return '#00796B';
      case AssetClass.OTHER:
        return '#616161';
    }
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
