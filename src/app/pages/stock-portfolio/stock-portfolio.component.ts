import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DepositWalletComponent } from 'src/app/dialog/deposit-wallet/deposit-wallet.component';

@Component({
  selector: 'app-stock-portfolio',
  templateUrl: './stock-portfolio.component.html',
  styleUrls: ['./stock-portfolio.component.scss']
})
export class StockPortfolioComponent {
  constructor(
    public dialogService: MatDialog
  ) {}

  openDialog(): void {
    this.dialogService.open(DepositWalletComponent);
  }
}
