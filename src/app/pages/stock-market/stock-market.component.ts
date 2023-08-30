import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-stock-market',
  templateUrl: './stock-market.component.html',
  styleUrls: ['./stock-market.component.scss']
})
export class StockMarketComponent {

  public tradeForm!: FormGroup;
  public accountCtrl!: FormControl;
  public amountCtrl!: FormControl;
  public tradeTypeCtrl!: FormControl;
  public typePriceCtrl!: FormControl;

  public typeOfTradePrice: string[] = [
    "Market price", "Custom price"
   ]

}
