import { Component } from '@angular/core';
import { DialogService } from 'src/app/service/dialog.service';

@Component({
  selector: 'app-stock-market',
  templateUrl: './stock-market.component.html',
  styleUrls: ['./stock-market.component.scss']
})
export class StockMarketComponent {

  constructor(
    private dialogService: DialogService
  ) {}

  openDialog() {
    this.dialogService.openBuyOrSellStockDialog();
  }
}
