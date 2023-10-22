import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DepositWalletComponent } from '../dialog/deposit-wallet.dialog/deposit-wallet.component';
import { BudgetTrackerComponent } from '../dialog/budget-tracker/budget-tracker.component';


@Injectable({
  providedIn: 'root',
})
export class DialogService {

  constructor(private dialog: MatDialog) { }

  public openDepositDialog(): void {
    this.dialog.open(DepositWalletComponent);
  }

  public openBudgetTracker(): void {
    this.dialog.open(BudgetTrackerComponent);
  }
}
