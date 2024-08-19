import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MoneyDirective } from '../../../../../directive/money.directive';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'pgz-popup-monthly-budget',
  standalone: true,
  imports: [MatFormFieldModule, MoneyDirective, FormsModule, MatInputModule],
  templateUrl: './popup-monthly-budget.component.html',
  styleUrl: './popup-monthly-budget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PopupMonthlyBudgetComponent {
  public monthlyBudget: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { currentBudget: string },
    private dialogRef: MatDialogRef<PopupMonthlyBudgetComponent>
  ) {
    console.log(data.currentBudget)
    this.monthlyBudget = data.currentBudget;
  }

  public saveMonthlyBudget(): void {
    this.dialogRef.close(this.monthlyBudget);
  }
}
