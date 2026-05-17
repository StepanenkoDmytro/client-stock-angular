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
import { ITag } from '../../../../domain/tag.domain';
import { PrevRouteComponent } from '../../../../core/UI/components/prev-route/prev-route.component';
import { HoldingService } from '../../service/holding.service';
import { InstrumentService } from '../../service/instrument.service';
import { TagsService } from '../../service/tags.service';
import { selectHoldingsList } from '../../store/holdings.selectors';
import { selectTagsList } from '../../store/tags.selectors';
import { HoldingCardComponent } from './holding-card/holding-card.component';
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
    PrevRouteComponent,
    HoldingCardComponent,
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

  // ---- Filter + sort state ----

  public readonly selectedClass = signal<ClassFilter>('ALL');
  public readonly selectedTagIds = signal<ReadonlySet<string>>(new Set());
  public readonly sortBy = signal<SortKey>('value');

  public readonly sortOptions: ReadonlyArray<SortOption> = SORT_OPTIONS;

  public readonly availableClasses = computed<AssetClass[]>(() => {
    const set = new Set<AssetClass>();
    for (const h of this.holdingsView()) {
      set.add(h.instrument.assetClass);
    }
    return Array.from(set).sort();
  });

  public readonly availableTags = computed<ITag[]>(() => {
    const byId = new Map<string, ITag>();
    for (const h of this.holdingsView()) {
      for (const t of h.tags) {
        byId.set(t.id, t);
      }
    }
    return Array.from(byId.values()).sort(tagSort);
  });

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

  /** Sorted variant of `filteredHoldings`, drives the actual list render. */
  public readonly sortedFilteredHoldings = computed<IHoldingView[]>(() => {
    const list = this.filteredHoldings().slice();
    const key = this.sortBy();

    switch (key) {
      case 'value':
        return list.sort(
          (a, b) => this.currentValue(b) - this.currentValue(a),
        );
      case 'lifetime':
        return list.sort((a, b) => this.pnl(b) - this.pnl(a));
      case 'income':
        // Stub: no real income data yet. Preserve incoming order.
        return list;
      case 'name':
        return list.sort((a, b) =>
          a.instrument.name.localeCompare(b.instrument.name),
        );
      case 'recent':
        return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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

  public readonly totalCount = computed(() => this.holdingsView().length);
  public readonly filteredCount = computed(
    () => this.filteredHoldings().length,
  );

  public readonly sortLabel = computed<string>(() => {
    const opt = SORT_OPTIONS.find((o) => o.key === this.sortBy());
    return opt?.label ?? 'Sort';
  });

  /**
   * Live "show N" preview for the Filter bottom sheet. Recomputes the
   * filtered count as the user toggles tags inside the sheet — the sheet
   * passes back its current selection through this callback.
   */
  public readonly previewMatchCount = (
    selectedTags: ReadonlySet<string>,
  ): number => {
    const klass = this.selectedClass();
    return this.holdingsView().filter((h) => {
      if (klass !== 'ALL' && h.instrument.assetClass !== klass) {
        return false;
      }
      if (selectedTags.size > 0 && !h.tagIds.some((id) => selectedTags.has(id))) {
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

  // ---- Internals ----

  private currentValue(h: IHoldingView): number {
    const price =
      this.holdings.getCurrentPrice(h.instrument.symbol) ?? h.averageBuyPrice;
    return h.quantity * price;
  }

  private pnl(h: IHoldingView): number {
    return this.currentValue(h) - h.quantity * h.averageBuyPrice;
  }
}

function tagSort(a: ITag, b: ITag): number {
  if (a.system !== b.system) {
    return a.system ? -1 : 1;
  }
  return a.name.localeCompare(b.name);
}
