import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheetModule,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';

/**
 * Bottom-sheet shown when the user taps the delete icon on an account
 * row. Confirms because the backend CASCADE FK on `holding.account_id`
 * means deleting an account ALSO drops every holding on it — that's
 * destructive and the user should know.
 */
export interface DeleteAccountConfirmData {
  /** Display label (accountNumber || derived "{provider} {type}"). */
  label: string;
  /**
   * How many holdings will be wiped along with this account. Caller
   * computes from the holdings store. 0 means "nothing to lose".
   */
  holdingsCount: number;
}

export type DeleteAccountConfirmResult = 'delete' | 'cancel';

@Component({
  selector: 'pgz-delete-account-confirm',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatBottomSheetModule],
  templateUrl: './delete-account-confirm.component.html',
  styleUrl: './delete-account-confirm.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteAccountConfirmComponent {
  constructor(
    private readonly sheetRef: MatBottomSheetRef<
      DeleteAccountConfirmComponent,
      DeleteAccountConfirmResult
    >,
    @Inject(MAT_BOTTOM_SHEET_DATA) public readonly data: DeleteAccountConfirmData,
  ) {}

  public onConfirm(): void {
    this.sheetRef.dismiss('delete');
  }

  public onCancel(): void {
    this.sheetRef.dismiss('cancel');
  }
}
