import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Bottom-sheet payload for the delete-holding confirmation.
 *
 *   symbol           — Instrument symbol (`AAPL`, `BTC`) shown in the title.
 *   accountName?     — optional location label ("Cold wallet (Trezor)").
 *                       Absent for MANUAL holdings — title falls back to
 *                       "Delete {symbol}?".
 *   quantity         — raw quantity, formatted by the template.
 *   averageBuyPrice  — avg cost basis per unit.
 *   currentValue     — current market value (qty × live price), pre-
 *                       computed by the caller so the sheet stays
 *                       presentation-only and doesn't import services.
 *   currency         — display currency (USD / EUR / UAH / …).
 */
export interface DeleteHoldingConfirmData {
  symbol: string;
  accountName?: string;
  quantity: number;
  averageBuyPrice: number;
  currentValue: number;
  currency: string;
}

export type DeleteHoldingConfirmResult = 'delete' | 'cancel';

/**
 * Confirmation bottom-sheet shown when the user picks "Delete" from the
 * overflow menu on a position-row or single-holding position-card.
 *
 * Per `docs/notes/2026-05-pr4-crud-holdings-task.md` §5 Delete flow + UX
 * principles §8.5 (destructive actions go through a bottom-sheet, not a
 * snackbar/inline button).
 */
@Component({
  selector: 'pgz-delete-holding-confirm',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './delete-holding-confirm.component.html',
  styleUrl: './delete-holding-confirm.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteHoldingConfirmComponent {
  constructor(
    private readonly bottomSheetRef: MatBottomSheetRef<
      DeleteHoldingConfirmComponent,
      DeleteHoldingConfirmResult
    >,
    @Inject(MAT_BOTTOM_SHEET_DATA)
    public readonly data: DeleteHoldingConfirmData,
  ) {}

  public onCancel(): void {
    this.bottomSheetRef.dismiss('cancel');
  }

  public onDelete(): void {
    this.bottomSheetRef.dismiss('delete');
  }

  // ---- Display helpers ----

  public formatQty(qty: number): string {
    if (Number.isInteger(qty)) {
      return qty.toLocaleString('en-US');
    }
    return qty.toLocaleString('en-US', { maximumFractionDigits: 8 });
  }

  public formatMoney(value: number): string {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }
}
