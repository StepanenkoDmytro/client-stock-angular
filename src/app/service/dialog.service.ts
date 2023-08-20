import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DepositWalletComponent } from '../dialog/deposit-wallet/deposit-wallet.component';


@Injectable({
  providedIn: 'root',
})
export class DialogService {

  constructor(private dialog: MatDialog) { }

  openDialog(): void {
    this.dialog.open(DepositWalletComponent);
  }
}
