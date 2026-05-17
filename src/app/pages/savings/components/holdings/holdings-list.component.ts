import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { AssetClass } from '../../../../domain/asset-class.domain';
import { IHoldingView } from '../../../../domain/holding.domain';
import { ITag } from '../../../../domain/tag.domain';
import { PrevRouteComponent } from '../../../../core/UI/components/prev-route/prev-route.component';
import { HoldingService } from '../../service/holding.service';
import { InstrumentService } from '../../service/instrument.service';
import { TagsService } from '../../service/tags.service';
import { selectHoldingsList } from '../../store/holdings.selectors';
import { selectTagsList } from '../../store/tags.selectors';
import { HoldingCardComponent } from './holding-card/holding-card.component';
import { PortfolioSummaryComponent } from './portfolio-summary/portfolio-summary.component';

type ClassFilter = AssetClass | 'ALL';

@Component({
  selector: 'pgz-holdings-list',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    PrevRouteComponent,
    HoldingCardComponent,
    PortfolioSummaryComponent,
  ],
  templateUrl: './holdings-list.component.html',
  styleUrl: './holdings-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HoldingsListComponent implements OnInit {
  /**
   * When false (embedded inside SavingsComponent's toggle), hide the
   * pgz-prev-route header and the .page wrapper — the parent handles
   * page chrome. When true (standalone route /savings/holdings), render
   * the full screen with back-arrow header.
   */
  @Input() public showHeader: boolean = true;

  /**
   * When false, skip the internal portfolio summary card. Used when the
   * component is embedded inside SavingsComponent, where the parent
   * renders the summary above both views so it persists across the
   * toggle without re-mounting.
   */
  @Input() public showSummary: boolean = true;

  /**
   * When set on mount, applies the given AssetClass to the class filter
   * immediately, so the user lands with the desired narrow view. Used by
   * the Classes-accordion "Show all N" links in SavingsComponent.
   *
   * Set via a setter to apply at the moment the input is bound, because
   * the inner `selectedClass` signal needs to be updated before first
   * paint to avoid a flash of unfiltered content.
   */
  @Input()
  public set initialClassFilter(value: AssetClass | null | undefined) {
    if (value) {
      this.selectedClass.set(value);
    }
  }

  private readonly router = inject(Router);
  private readonly store = inject(Store);
  private readonly holdings = inject(HoldingService);
  private readonly instruments = inject(InstrumentService);
  private readonly tags = inject(TagsService);

  // ---- Source signals from store (created ONCE at field init — never inside computed) ----
  private readonly rawHoldings = this.store.selectSignal(selectHoldingsList);
  private readonly rawTags = this.store.selectSignal(selectTagsList);

  /**
   * Joined IHoldingView projection. Pure `computed` over three source
   * signals — store holdings, store tags, and instrument cache. No
   * `selectSignal` inside computed (that's the antipattern we fixed in
   * TagFormComponent — it creates a fresh subscription per rerun and
   * breaks downstream reactivity, leading to stale `filteredHoldings`).
   */
  public readonly holdingsView = computed<IHoldingView[]>(() => {
    const instrMap = this.instruments.instruments();
    const holdings = this.rawHoldings();
    const tags = this.rawTags();
    const tagsById = new Map(tags.map((t) => [t.id, t]));
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

  // ---- Filter state ----
  public readonly selectedClass = signal<ClassFilter>('ALL');
  public readonly selectedTagIds = signal<ReadonlySet<string>>(new Set());

  /**
   * Whether the tag filter card is expanded to show all tags or collapsed
   * to a single row. Defaults to collapsed — most users will rarely use
   * more than the top few tags, and a tall always-expanded grid eats
   * vertical space on mobile.
   */
  public readonly tagsExpanded = signal(false);

  /** AssetClass values that actually appear in current holdings — drives chip row. */
  public readonly availableClasses = computed<AssetClass[]>(() => {
    const set = new Set<AssetClass>();
    for (const h of this.holdingsView()) {
      set.add(h.instrument.assetClass);
    }
    return Array.from(set).sort();
  });

  /** Tags actually used by any holding (system+user, dedup by id). */
  public readonly availableTags = computed<ITag[]>(() => {
    const byId = new Map<string, ITag>();
    for (const h of this.holdingsView()) {
      for (const t of h.tags) {
        byId.set(t.id, t);
      }
    }
    return Array.from(byId.values()).sort(tagSort);
  });

  /**
   * Show the expand/collapse chevron only when there are enough tags to
   * actually overflow a single row. Below threshold, the toggle would do
   * nothing and just adds visual noise.
   */
  private static readonly TAGS_OVERFLOW_THRESHOLD = 5;
  public readonly tagsHaveOverflow = computed(
    () =>
      this.availableTags().length >
      HoldingsListComponent.TAGS_OVERFLOW_THRESHOLD,
  );

  /**
   * Apply both filter axes. AND between axes (class AND tag), OR inside the
   * tags axis (any selected tag matches). When no filter is active, returns
   * the full holdingsView.
   */
  public readonly filteredHoldings = computed<IHoldingView[]>(() => {
    const klass = this.selectedClass();
    const tagIds = this.selectedTagIds();
    return this.holdingsView().filter((h) => {
      if (klass !== 'ALL' && h.instrument.assetClass !== klass) {
        return false;
      }
      if (tagIds.size > 0 && !h.tagIds.some((id) => tagIds.has(id))) {
        return false;
      }
      return true;
    });
  });

  public readonly hasActiveFilters = computed(
    () => this.selectedClass() !== 'ALL' || this.selectedTagIds().size > 0,
  );

  public readonly totalCount = computed(() => this.holdingsView().length);
  public readonly filteredCount = computed(
    () => this.filteredHoldings().length,
  );

  // ---- Portfolio summary ----

  /**
   * Per-class breakdown for the summary card. Always computed against the
   * FULL holdings set (not filtered) — the summary represents the entire
   * portfolio, filters below only narrow the visible list.
   *
   * `value` is current market value (quantity × currentPrice). `costBasis`
   * is what the user paid. `pnl` = value - costBasis. `share` is value's
   * fraction of the total portfolio (0..1). Sorted by value desc.
   */
  public readonly summary = computed(() => {
    const all = this.holdingsView();
    const byClass = new Map<AssetClass, { value: number; costBasis: number }>();

    for (const h of all) {
      const currentPrice =
        this.holdings.getCurrentPrice(h.instrument.symbol) ?? h.averageBuyPrice;
      const value = h.quantity * currentPrice;
      const cost = h.quantity * h.averageBuyPrice;
      const existing = byClass.get(h.instrument.assetClass) ?? {
        value: 0,
        costBasis: 0,
      };
      byClass.set(h.instrument.assetClass, {
        value: existing.value + value,
        costBasis: existing.costBasis + cost,
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
    const totalPnL = totalValue - totalCost;
    const totalPnLPercent =
      totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

    const breakdown = Array.from(byClass.entries())
      .map(([assetClass, { value, costBasis }]) => ({
        assetClass,
        label: this.assetClassLabel(assetClass),
        color: this.assetClassBadgeColor(assetClass),
        value,
        costBasis,
        pnl: value - costBasis,
        pnlPercent: costBasis > 0 ? ((value - costBasis) / costBasis) * 100 : 0,
        share: totalValue > 0 ? value / totalValue : 0,
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

  public abs(n: number): number {
    return Math.abs(n);
  }

  public formatPercent(value: number, fractionDigits = 1): string {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }) + '%';
  }

  ngOnInit(): void {
    this.tags.init();
    this.instruments.init();
    this.holdings.init();
  }

  // ---- Filter handlers ----

  public onSelectClass(klass: ClassFilter): void {
    this.selectedClass.set(klass);
  }

  public onToggleTag(id: string): void {
    this.selectedTagIds.update((set) => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  public isTagSelected(id: string): boolean {
    return this.selectedTagIds().has(id);
  }

  public clearFilters(): void {
    this.selectedClass.set('ALL');
    this.selectedTagIds.set(new Set());
  }

  public toggleTagsExpanded(): void {
    this.tagsExpanded.update((v) => !v);
  }

  // ---- Navigation / actions ----

  public goBack(): void {
    this.router.navigate(['/savings']);
  }

  public resetDemo(): void {
    this.holdings.resetDemoData();
    this.clearFilters();
  }

  // ---- Display helpers ----

  public totalCost(h: IHoldingView): number {
    return h.quantity * h.averageBuyPrice;
  }

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

  public formatNumber(value: number, fractionDigits = 2): string {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
  }

  public formatQuantity(h: IHoldingView): string {
    if (h.instrument.assetClass === AssetClass.CRYPTO) {
      return h.quantity.toLocaleString('en-US', {
        maximumFractionDigits: 8,
      });
    }
    return this.formatNumber(h.quantity, 2);
  }
}

function tagSort(a: ITag, b: ITag): number {
  if (a.system !== b.system) {
    return a.system ? -1 : 1;
  }
  return a.name.localeCompare(b.name);
}
