import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { ACCOUNTS_MOCK, IAccount } from 'src/app/domain/account.domain';

export interface PurchaseData {
  countStocks: number,
  accountID: number,
  tradeType: boolean,
  typeCtrl: string
}

@Component({
  selector: 'app-trade-stock',
  templateUrl: './trade-stock.dialog.component.html',
  styleUrls: ['./trade-stock.dialog.component.scss']
})
export class TradeStockDialogComponent implements OnInit {
  public accounts: IAccount[] = ACCOUNTS_MOCK;

  public tradeForm!: FormGroup;
  public accountCtrl!: FormControl;
  public amountCtrl!: FormControl;
  public tradeTypeCtrl!: FormControl;
  public typePriceCtrl!: FormControl;

  public typeOfTradePrice: string[] = [
    "Market price", "Custom price"
   ]

  constructor(
    private formBuilder: FormBuilder
  ) {}

  public tabChanged(event: any) {
    this.tradeTypeCtrl.setValue(!event.index);
  }

  ngOnInit(): void {
    this.accountCtrl = new FormControl(this.accounts[0].id);
    this.amountCtrl = new FormControl('');
    this.tradeTypeCtrl = new FormControl(false);
    this.typePriceCtrl = new FormControl(this.typeOfTradePrice[0]);

    this.tradeForm = this.formBuilder.group({
      account: this.accountCtrl,
      amount: this.amountCtrl,
      tradeType: this.tradeTypeCtrl,
      typePrice: this.typePriceCtrl,
    });
  }

  public onSubmit() {
    const formData = this.tradeForm.value as PurchaseData;
    console.log(formData); 
  }
}


