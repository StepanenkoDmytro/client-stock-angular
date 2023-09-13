import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { IPortfolio } from 'src/app/domain/portfolio.domain';
import { ACCOUNTS_MOCK } from 'src/app/domain/mock.domain';
import { TradePriceType } from 'src/app/domain/trade.domain';


@Component({
  selector: 'app-trade-stock',
  templateUrl: './trade-stock.component.html',
  styleUrls: ['./trade-stock.component.scss']
})
export class TradeStockComponent {

  public accounts: IPortfolio[] = ACCOUNTS_MOCK;

  public typePriceCtrl: FormControl<TradePriceType | null>  = new FormControl(TradePriceType.MarketPrice);
  public accountCtrl: FormControl<IPortfolio | null>  = new FormControl(this.accounts[0]);

  public typeOfTradePrice: TradePriceType[] = [
    TradePriceType.MarketPrice,
    TradePriceType.CustomPrice,
  ];
}
