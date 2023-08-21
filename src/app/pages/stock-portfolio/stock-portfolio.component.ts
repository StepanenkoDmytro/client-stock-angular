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
  public displayedColumns: string[] = [ 'name', 'countStocks', 'buyPrice', 'price', 'coast', 'sector', 'dividendYield', 'share', 'profit', 'growth', 'currency'];
  public dataSource: MatTableDataSource<IAccountStock>;

  constructor(
    public dialogService: DialogService
  ) {
    this.dataSource = new MatTableDataSource(ACCOUNT_STOCKS_MOCK);
  }

  openDialog(): void {
    this.dialogService.openDepositDialog();
  }
}
