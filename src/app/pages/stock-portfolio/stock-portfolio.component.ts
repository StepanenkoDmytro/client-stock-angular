import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { IAccountStock } from 'src/app/domain/account.domain';
import { ACCOUNT_STOCKS_MOCK } from 'src/app/domain/mock.domain';
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
