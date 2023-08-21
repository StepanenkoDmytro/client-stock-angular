import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DepositWalletComponent } from '../dialog/deposit-wallet.dialog/deposit-wallet.component';
import { TradeStockDialogComponent } from '../dialog/trade-stock.dialog/trade-stock.dialog.component';


@Injectable({
  providedIn: 'root',
})
export class DialogService {

  constructor(private dialog: MatDialog) { }

  openDepositDialog(): void {
    // this.dialog.open(DepositWalletComponent);
   
    const dialogRef = this.dialog.open(TradeStockDialogComponent);

    dialogRef.afterClosed().subscribe(result => {
      console.log(result);
    });
  }

  openBuyOrSellStockDialog(): void {
    const dialogRef = this.dialog.open(TradeStockDialogComponent);

    dialogRef.afterClosed().subscribe(result => {
      console.log(result);
    });
  }
}
