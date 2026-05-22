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
import {
  MatBottomSheet,
  MatBottomSheetModule,
} from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { AssetClass } from '../../../../domain/asset-class.domain';
import { IHoldingView } from '../../../../domain/holding.domain';
import { IPosition } from '../../../../domain/position.domain';
import { ITag } from '../../../../domain/tag.domain';
import { EmptyStateComponent } from '../../../../core/UI/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../../core/UI/components/page-header/page-header.component';
import { PositionCardComponent } from '../positions/position-card/position-card.component';
import { HoldingService } from '../../service/holding.service';
import { InstrumentService } from '../../service/instrument.service';
import { PositionsService } from '../../service/positions.service';
import { TagsService } from '../../service/tags.service';
import { selectHoldingsList } from '../../store/holdings.selectors';
import { selectTagsList } from '../../store/tags.selectors';
import {
  HoldingsFilterSheetComponent,
  HoldingsFilterSheetData,
  HoldingsFilterSheetResult,
} from './holdings-filter-sheet/holdings-filter-sheet.component';
import { PortfolioSummaryComponent } from './portfolio-summary/portfolio-summary.component';

type ClassFilter = AssetClass | 'ALL';

/**
 * Sort keys for the Holdings flat view. Reference: portfolio-screen-plan
 * §PR5. "Income" is a stub until M5.5 — the list keeps its previous order
 * when selected (no real income data to sort on yet).
 */
type SortKey = 'value' | 'lifetime' | 'income' | 'name' | 'recent';

interface SortOption {
  key: SortKey;
  label: string;
}

const SORT_OPTIONS: SortOption[] = [
  { key: 'value', label: 'By value' },
  { key: 'lifetime', label: 'By lifetime return' },
  { key: 'income', label: 'By income earned' },
  { key: 'name', label: 'By name' },
  { key: 'recent', label: 'Recently added' },
];

@Component({
  selector: 'pgz-holdings-list',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatBottomSheetModule,
    MatMenuModule,
    EmptyStateComponent,
    PageHeaderComponent,
    PositionCardComponent,
    PortfolioSummaryComponent,
  ],
  templateUrl: './holdings-list.component.html',
  styleUrl: './holdings-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HoldingsListComponent implements OnInit {
  @Input() public showHeader: boolean = true;
  @Input() public showSummary: boolean = true;

  /**
   * Initial class filter applied on mount. Lets SavingsComponent's
   * "Show all N" links land the user with the matching class pre-selected.
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
  private readonly positionsSvc = inject(PositionsService);
  private readonly tags = inject(TagsService);
  private readonly bottomSheet = inject(MatBottomSheet);

  private readonly rawHoldings = this.store.selectSignal(selectHoldingsList);
  private readonly rawTags = this.store.selectSignal(selectTagsList);

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

  /**
   * Holdings re-bucketed per Instrument via PositionsService. This is the
   * basis for both filtering and rendering in flat view — we never show
   * raw `IHoldingView` rows at this level anymore (each Position-card
   * already exposes per-Account holdings via expand/collapse).
   */
  public readonly allPositions = computed<IPosition[]>(() => {
    const priceFor = (symbol: string): number | undefined =>
      this.holdings.getCurrentPrice(symbol);
    return this.positionsSvc.fromHoldings(this.holdingsView(), priceFor);
  });

  // ---- Filter + sort state ----

  public readonly selectedClass = signal<ClassFilter>('ALL');
  public readonly selectedTagIds = signal<ReadonlySet<string>>(new Set());
  public readonly sortBy = signal<SortKey>('value');

  public readonly sortOptions: ReadonlyArray<SortOption> = SORT_OPTIONS;

  public readonly availableClasses = computed<AssetClass[]>(() => {
    const set = new Set<AssetClass>();
    for (const p of this.allPositions()) {
      set.add(p.instrument.assetClass);
    }
    return Array.from(set).sort();
  });

  public readonly availableTags = computed<ITag[]>(() => {
    const byId = new Map<string, ITag>();
    for (const p of this.allPositions()) {
      for (const t of p.tags) {
        byId.set(t.id, t);
      }
    }
    return Array.from(byId.values()).sort(tagSort);
  });

  public readonly filteredPositions = computed<IPosition[]>(() => {
    const klass = this.selectedClass();
    const tagIds = this.selectedTagIds();
    return this.allPositions().filter((p) => {
      if (klass !== 'ALL' && p.instrument.assetClass !== klass) {
        return false;
      }
      if (tagIds.size > 0 && !p.tags.some((t) => tagIds.has(t.id))) {
        return false;
      }
      return true;
    });
  });

  /** Sorted variant of `filteredPositions` — drives the rendered list. */
  public readonly sortedFilteredPositions = computed<IPosition[]>(() => {
    const list = this.filteredPositions().slice();
    const key = this.sortBy();

    switch (key) {
      case 'value':
        return list.sort((a, b) => b.totalValue - a.totalValue);
      case 'lifetime':
        return list.sort((a, b) => b.paperPnL - a.paperPnL);
      case 'income':
        // Stub: no real income data yet. Preserve incoming order.
        return list;
      case 'name':
        return list.sort((a, b) =>
          a.instrument.name.localeCompare(b.instrument.name),
        );
      case 'recent':
        // Position has no createdAt — use the newest createdAt across its
        // holdings as a proxy for "recently added".
        return list.sort((a, b) => newestHoldingAt(b) - newestHoldingAt(a));
    }
  });

  public readonly hasActiveFilters = computed(
    () => this.selectedClass() !== 'ALL' || this.selectedTagIds().size > 0,
  );

  public readonly activeFilterCount = computed(() => {
    let count = 0;
    if (this.selectedClass() !== 'ALL') count++;
    if (this.selectedTagIds().size > 0) count++;
    return count;
  });

  public readonly totalCount = computed(() => this.allPositions().length);
  public readonly filteredCount = computed(
    () => this.filteredPositions().length,
  );

  /** Full label for the Sort dropdown button (e.g. "By value"). */
  public readonly sortLabel = computed<string>(() => {
    const opt = SORT_OPTIONS.find((o) => o.key === this.sortBy());
    return opt?.label ?? 'Sort';
  });

  /**
   * "sortLabel" with the leading "By " stripped — used by the result-row
   * line `... sorted by {sortLabelShort}` to avoid the "sorted by by value"
   * duplication (PR5c §5).
   */
  public readonly sortLabelShort = computed<string>(() => {
    const label = this.sortLabel();
    return label.replace(/^by\s+/i, '').toLowerCase();
  });

  /**
   * Live "show N" preview for the Filter bottom sheet. Recomputes the
   * filtered position count as the user toggles tags inside the sheet.
   */
  public readonly previewMatchCount = (
    selectedTags: ReadonlySet<string>,
  ): number => {
    const klass = this.selectedClass();
    return this.allPositions().filter((p) => {
      if (klass !== 'ALL' && p.instrument.assetClass !== klass) {
        return false;
      }
      if (selectedTags.size > 0 && !p.tags.some((t) => selectedTags.has(t.id))) {
        return false;
      }
      return true;
    }).length;
  };

  ngOnInit(): void {
    this.tags.init();
    this.instruments.init();
    this.holdings.init();
  }

  // ---- Filter / sort handlers ----

  public onSelectClass(klass: ClassFilter): void {
    this.selectedClass.set(klass);
  }

  public onSelectSort(key: SortKey): void {
    this.sortBy.set(key);
  }

  public openFilterSheet(): void {
    const data: HoldingsFilterSheetData = {
      availableTags: this.availableTags(),
      selectedTagIds: this.selectedTagIds(),
      matchCount: this.previewMatchCount,
    };

    const ref = this.bottomSheet.open<
      HoldingsFilterSheetComponent,
      HoldingsFilterSheetData,
      HoldingsFilterSheetResult
    >(HoldingsFilterSheetComponent, {
      data,
      panelClass: 'holdings-filter-sheet-container',
    });

    ref.afterDismissed().subscribe((result) => {
      if (result?.applied) {
        this.selectedTagIds.set(new Set(result.selectedTagIds));
      }
    });
  }

  public clearFilters(): void {
    this.selectedClass.set('ALL');
    this.selectedTagIds.set(new Set());
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
        // ETF visually grouped with STOCK (same blue family) but with
        // a distinct token so designer can re-tint later if needed.
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

function tagSort(a: ITag, b: ITag): number {
  if (a.system !== b.system) {
    return a.system ? -1 : 1;
  }
  return a.name.localeCompare(b.name);
}

/** Newest holding timestamp inside a Position (ISO-8601 comparison via
 *  Date.parse). 0 when the position has no holdings (defensive — shouldn't
 *  happen in practice since PositionsService never emits empty groups). */
function newestHoldingAt(p: IPosition): number {
  let max = 0;
  for (const h of p.holdings) {
    const t = Date.parse(h.createdAt);
    if (!Number.isNaN(t) && t > max) {
      max = t;
    }
  }
  return max;
}
