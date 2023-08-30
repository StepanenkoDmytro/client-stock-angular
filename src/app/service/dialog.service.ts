import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DepositWalletComponent } from '../dialog/deposit-wallet.dialog/deposit-wallet.component';


@Injectable({
  providedIn: 'root',
})
export class DialogService {

  constructor(private dialog: MatDialog) { }

  openDepositDialog(): void {
    this.dialog.open(DepositWalletComponent);
  }
}
