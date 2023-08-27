import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { ACCOUNTS_MOCK, IAccount, IAccountStock } from 'src/app/domain/account.domain';
import { ACCOUNT_STOCKS_MOCK } from 'src/app/domain/mock.domain';
import { DialogService } from 'src/app/service/dialog.service';

@Component({
  selector: 'app-stock-market',
  templateUrl: './stock-market.component.html',
  styleUrls: ['./stock-market.component.scss']
})
export class StockMarketComponent {

  public displayedColumns: string[] = [ 'name', 'countStocks', 'price', 'sector', 'dividendYield', 'currency'];
  public dataSource: MatTableDataSource<IAccountStock>;

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
    private dialogService: DialogService
  ) {
    this.dataSource = new MatTableDataSource(ACCOUNT_STOCKS_MOCK);
  }

  openDialog() {
    this.dialogService.openBuyOrSellStockDialog();
  }
}
