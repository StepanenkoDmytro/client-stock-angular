import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';

import { Category } from '../../../../../domain/category.domain';

/**
 * Selected parent target. `'root'` means «top-level under the current
 * root» (Income or Spending); `Category` means «child of this category».
 * `null` is never returned — Save is gated by a valid name.
 */
export type EditCategorySheetParent = Category | 'root';

export interface EditCategorySheetData {
  source: Category;
  root: Category;
  /** Same-root tree minus self + descendants (cycle guard, computed by caller). */
  candidates: Array<{ category: Category; depth: number; ancestorsPath: string }>;
  /** Whether the source is currently NOT already top-level (i.e. moving to root is a real change). */
  canMakeTopLevel: boolean;
}

export interface EditCategorySheetResult {
  name: string;
  parent: EditCategorySheetParent;
}

@Component({
  selector: 'pgz-edit-category-sheet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-category-sheet.component.html',
  styleUrl: './edit-category-sheet.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditCategorySheetComponent {
  public name: string;
  public selectedParent: EditCategorySheetParent;

  constructor(
    private readonly ref: MatBottomSheetRef<EditCategorySheetComponent, EditCategorySheetResult | 'cancel'>,
    @Inject(MAT_BOTTOM_SHEET_DATA) public readonly data: EditCategorySheetData,
  ) {
    this.name = data.source.title;
    // Default selection mirrors the source's current placement so a no-
    // op Save just renames (or even does nothing).
    this.selectedParent = data.source.parent === data.root.id
      ? 'root'
      : (data.candidates.find(c => c.category.id === data.source.parent)?.category ?? 'root');
  }

  public pickRoot(): void {
    this.selectedParent = 'root';
  }

  public pickCategory(category: Category): void {
    this.selectedParent = category;
  }

  public isSelectedRoot(): boolean {
    return this.selectedParent === 'root';
  }

  public isSelected(category: Category): boolean {
    return this.selectedParent !== 'root'
      && (this.selectedParent as Category).id === category.id;
  }

  public canSave(): boolean {
    return this.name.trim().length > 0;
  }

  public save(): void {
    const trimmed = this.name.trim();
    if (!trimmed) {
      return;
    }
    this.ref.dismiss({ name: trimmed, parent: this.selectedParent });
  }

  public cancel(): void {
    this.ref.dismiss('cancel');
  }
}
