import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { IAccount } from 'src/app/domain/account.domain';
import { ACCOUNTS_MOCK } from 'src/app/domain/mock.domain';
import { TradePriceType } from 'src/app/domain/trade.domain';


@Component({
  selector: 'app-trade-stock',
  templateUrl: './trade-stock.component.html',
  styleUrls: ['./trade-stock.component.scss']
})
export class TradeStockComponent {

  public accounts: IAccount[] = ACCOUNTS_MOCK;

  public typePriceCtrl: FormControl<TradePriceType | null>  = new FormControl(TradePriceType.MarketPrice);
  public accountCtrl: FormControl<IAccount | null>  = new FormControl(this.accounts[0]);

  public typeOfTradePrice: TradePriceType[] = [
    TradePriceType.MarketPrice,
    TradePriceType.CustomPrice,
  ];
}
