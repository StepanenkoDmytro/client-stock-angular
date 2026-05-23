import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Mode passed in by the caller — switches the sheet's destructive vs
 * additive copy + primary action.
 *
 *   active  → "Clear demo data" (destructive). Used by the persistent
 *             amber banner (PR5) and by Profile when {@code isDemoActive}
 *             is true.
 *   cleared → "Restore demo data". Used by Profile «Demo data» row
 *             when demo was previously cleared.
 */
export type DemoActionsSheetMode = 'active' | 'cleared';

export interface DemoActionsSheetData {
  mode: DemoActionsSheetMode;
  /** Optional summary tail — e.g. "10 holdings · 7 accounts · 12 tags". */
  summary?: string;
}

export type DemoActionsSheetResult = 'clear' | 'restore' | 'cancel';

/**
 * Single-step confirmation sheet for the demo-data lifecycle actions.
 * Resolves task §8 Q3 — single confirm rather than a two-step wizard.
 * Per `docs/notes/2026-05-savings-empty-states-ladder.md` §5.2 + §6 PR5.
 */
@Component({
  selector: 'pgz-demo-actions-sheet',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './demo-actions-sheet.component.html',
  styleUrl: './demo-actions-sheet.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoActionsSheetComponent {
  constructor(
    private readonly bottomSheetRef: MatBottomSheetRef<
      DemoActionsSheetComponent,
      DemoActionsSheetResult
    >,
    @Inject(MAT_BOTTOM_SHEET_DATA)
    public readonly data: DemoActionsSheetData,
  ) {}

  public onPrimary(): void {
    this.bottomSheetRef.dismiss(
      this.data.mode === 'active' ? 'clear' : 'restore',
    );
  }

  public onCancel(): void {
    this.bottomSheetRef.dismiss('cancel');
  }
}
