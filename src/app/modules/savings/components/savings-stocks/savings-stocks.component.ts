import { Component } from '@angular/core';
import {
  ACCOUNT_STOCKS_MOCK,
  PROFIT_MOCK,
  STOCKS_MOCK,
} from '../../mock.domain';
import { IPortfolioStock } from '../../domain';

@Component({
  selector: 'app-savings-stocks',
  templateUrl: './savings-stocks.component.html',
  styleUrls: ['./savings-stocks.component.scss'],
})
export class SavingsStocksComponent {
  public stocksMock = STOCKS_MOCK;
  public profitMock = PROFIT_MOCK;
  public stocks: IPortfolioStock[] = ACCOUNT_STOCKS_MOCK;
  years: string[] = ['2022', '2023', '2024']; // Додайте необхідні роки
  months: string[] = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  public isPortfolioFrame: boolean = true;

  public onChangeFrame(frame: boolean): void {
    this.isPortfolioFrame = frame;
  }

  public trackYear(index: number, year: string): string {
    return year;
  }
}
