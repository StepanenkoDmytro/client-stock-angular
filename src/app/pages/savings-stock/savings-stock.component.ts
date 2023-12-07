import { Component } from '@angular/core';
import { ACCOUNT_STOCKS_MOCK, INCOME_MOCK, PROFIT_MOCK, STOCKS_MOCK } from 'src/app/domain/mock.domain';
import { IPortfolioStock } from 'src/app/domain/portfolio.domain';

@Component({
  selector: 'app-savings-stock',
  templateUrl: './savings-stock.component.html',
  styleUrls: ['./savings-stock.component.scss']
})
export class SavingsStockComponent {
  stocksMock = STOCKS_MOCK;
  profitMock = PROFIT_MOCK;
  public stocks: IPortfolioStock[] = ACCOUNT_STOCKS_MOCK;
}
