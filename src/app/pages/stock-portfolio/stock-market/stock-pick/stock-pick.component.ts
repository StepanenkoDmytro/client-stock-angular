import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { IPortfolio, IPortfolioStock } from 'src/app/domain/portfolio.domain';
import { ACCOUNTS_MOCK, ACCOUNT_STOCKS_MOCK } from 'src/app/domain/mock.domain';


@Component({
  selector: 'app-stock-pick',
  templateUrl: './stock-pick.component.html',
  styleUrls: ['./stock-pick.component.scss']
})
export class StockPickComponent {
  
  public displayedColumns: string[] = [ 'name', 'countStocks', 'price', 'sector', 'dividendYield', 'currency'];
  public profitDataSource: MatTableDataSource<IPortfolioStock> = new MatTableDataSource(ACCOUNT_STOCKS_MOCK);

  public accounts: IPortfolio[] = ACCOUNTS_MOCK;
}
