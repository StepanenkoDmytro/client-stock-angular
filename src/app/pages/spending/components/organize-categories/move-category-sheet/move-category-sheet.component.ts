import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';

import { Category } from '../../../../../domain/category.domain';

/**
 * Result returned via `dismiss`:
 * - Category → user picked this as the new parent
 * - 'root'   → user picked «Make top-level» (parent = root.id)
 * - 'cancel' → backed out
 */
export type MoveCategorySheetResult = Category | 'root' | 'cancel';

export interface MoveCategorySheetData {
  /** Category being moved. */
  source: Category;
  /** Same-root tree (Income or Spending) the user can move within. */
  root: Category;
  /** Pre-computed valid targets — caller filters out self + descendants. */
  candidates: Array<{ category: Category; depth: number; ancestorsPath: string }>;
  /** Whether «Make top-level» action is meaningful (source isn't already top-level). */
  canMakeTopLevel: boolean;
}

@Component({
  selector: 'pgz-move-category-sheet',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './move-category-sheet.component.html',
  styleUrl: './move-category-sheet.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MoveCategorySheetComponent {
  constructor(
    private readonly ref: MatBottomSheetRef<MoveCategorySheetComponent, MoveCategorySheetResult>,
    @Inject(MAT_BOTTOM_SHEET_DATA) public readonly data: MoveCategorySheetData,
  ) {}

  public pick(category: Category): void {
    this.ref.dismiss(category);
  }

  public makeTopLevel(): void {
    this.ref.dismiss('root');
  }

  public cancel(): void {
    this.ref.dismiss('cancel');
  }
}
