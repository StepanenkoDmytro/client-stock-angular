import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ACCOUNTS_MOCK, IAccount, IAccountStock } from 'src/app/domain/account.domain';
import { ACCOUNT_STOCKS_MOCK } from 'src/app/domain/mock.domain';

@Component({
  selector: 'app-stock-pick',
  templateUrl: './stock-pick.component.html',
  styleUrls: ['./stock-pick.component.scss']
})
export class StockPickComponent {
  
  public displayedColumns: string[] = [ 'name', 'countStocks', 'price', 'sector', 'dividendYield', 'currency'];
  public dataSource: MatTableDataSource<IAccountStock> = new MatTableDataSource(ACCOUNT_STOCKS_MOCK);

  public accounts: IAccount[] = ACCOUNTS_MOCK;
}
