import { Component } from '@angular/core';
import { ACCOUNT_STOCKS_MOCK, PROFIT_MOCK, STOCKS_MOCK } from '../../mock.domain';
import { IPortfolioStock } from '../../domain';

@Component({
  selector: 'app-savings-stocks',
  templateUrl: './savings-stocks.component.html',
  styleUrls: ['./savings-stocks.component.scss']
})
export class SavingsStocksComponent {
  stocksMock = STOCKS_MOCK;
  profitMock = PROFIT_MOCK;
  public stocks: IPortfolioStock[] = ACCOUNT_STOCKS_MOCK;
}
