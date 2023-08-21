import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DepositWalletComponent } from 'src/app/dialog/deposit-wallet.dialog/deposit-wallet.component';
import { DialogService } from 'src/app/service/dialog.service';

@Component({
  selector: 'app-stock-portfolio',
  templateUrl: './stock-portfolio.component.html',
  styleUrls: ['./stock-portfolio.component.scss']
})
export class StockPortfolioComponent {
  constructor(
    public dialogService: DialogService
  ) {}

  openDialog(): void {
    this.dialogService.openDepositDialog();
  }
}
