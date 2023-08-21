import { Component } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DepositWalletComponent } from 'src/app/dialog/deposit-wallet.dialog/deposit-wallet.component';


@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.scss']
})
export class PortfolioComponent {

  constructor(
    public dialogService: MatDialog
  ) {}

  openDialog(): void {
    const config = new MatDialogConfig();
    config.autoFocus = true;
    config.disableClose = true;
    config.hasBackdrop = true;
    // config.maxWidth = 1100;
    // config.minHeight = 1100;
     this.dialogService.open(DepositWalletComponent, config);
  }
}
