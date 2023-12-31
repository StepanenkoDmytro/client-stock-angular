import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { DepositWalletComponent } from '../dialog/deposit-wallet.dialog/deposit-wallet.component';
import { BudgetTrackerComponent } from '../pages/portfolio/category-finances/budget-tracker-wrapper/budget-tracker/budget-tracker.component';


@Injectable({
  providedIn: 'root',
})
export class DialogService {

  constructor(private dialog: MatDialog) { }

  public openDepositDialog(): void {
    this.dialog.open(DepositWalletComponent);
  }

  public openBudgetTracker(){
    // const dialogRef = this.dialog.open(BudgetTrackerComponent);

    // return dialogRef;
  }
}
