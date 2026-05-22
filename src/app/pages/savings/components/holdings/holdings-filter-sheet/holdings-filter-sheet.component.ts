import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  computed,
  signal,
} from '@angular/core';
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { ITag } from '../../../../../domain/tag.domain';
import { EmptyStateComponent } from '../../../../../core/UI/components/empty-state/empty-state.component';

export interface HoldingsFilterSheetData {
  /** All tags available for filtering (from holdings join). */
  availableTags: ITag[];
  /** Currently selected tag IDs at open-time. */
  selectedTagIds: ReadonlySet<string>;
  /** For each tag combination, parent provides a count callback so the
   *  Apply CTA can show "show N matches" live as user selects. */
  matchCount: (selected: ReadonlySet<string>) => number;
}

export interface HoldingsFilterSheetResult {
  selectedTagIds: ReadonlySet<string>;
  applied: boolean;
}

/**
 * Multi-select tag filter shown as a Material bottom-sheet over the
 * Holdings list. Reference: design/savings/01-portfolio-dashboard-mobile-
 * holdings.svg lines 250-303.
 *
 * Layout: drag handle · title row (Filter by tag + ✕) · counter row
 * (N of M selected + Clear) · 3-column tag grid · Apply CTA with live
 * match count.
 *
 * The component is fully local: it works on a copy of the parent's
 * selection so closing without Apply discards changes. Parent receives
 * final selection on bottom-sheet dismissal.
 */
@Component({
  selector: 'pgz-holdings-filter-sheet',
  standalone: true,
  imports: [CommonModule, MatButtonModule, EmptyStateComponent],
  templateUrl: './holdings-filter-sheet.component.html',
  styleUrl: './holdings-filter-sheet.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HoldingsFilterSheetComponent {
  /** Working copy of the selection — local until user taps Apply. */
  public readonly selected = signal<ReadonlySet<string>>(new Set());

  public readonly availableTags: ITag[];
  private readonly matchCount: (
    selected: ReadonlySet<string>,
  ) => number;

  public readonly selectedCount = computed(() => this.selected().size);
  public readonly totalCount: number;
  public readonly matchCountLive = computed(() => this.matchCount(this.selected()));

  constructor(
    private readonly ref: MatBottomSheetRef<
      HoldingsFilterSheetComponent,
      HoldingsFilterSheetResult
    >,
    @Inject(MAT_BOTTOM_SHEET_DATA) data: HoldingsFilterSheetData,
  ) {
    this.availableTags = data.availableTags;
    this.totalCount = data.availableTags.length;
    this.matchCount = data.matchCount;
    this.selected.set(new Set(data.selectedTagIds));
  }

  public isSelected(tagId: string): boolean {
    return this.selected().has(tagId);
  }

  public toggle(tagId: string): void {
    this.selected.update((set) => {
      const next = new Set(set);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  }

  public clear(): void {
    this.selected.set(new Set());
  }

  public apply(): void {
    this.ref.dismiss({ selectedTagIds: this.selected(), applied: true });
  }

  public close(): void {
    // Discard local changes — parent keeps prior selection.
    this.ref.dismiss({ selectedTagIds: new Set(), applied: false });
  }
}
