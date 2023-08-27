import { Component, Input, OnInit } from '@angular/core';
import { IAccountStock } from 'src/app/domain/account.domain';
import { ACCOUNT_STOCKS_MOCK } from 'src/app/domain/mock.domain';

@Component({
  selector: 'app-stock-details',
  templateUrl: './stock-details.component.html',
  styleUrls: ['./stock-details.component.scss']
})
export class StockDetailsComponent implements OnInit {
  public stock!: IAccountStock;

  ngOnInit(): void {
    this.stock = ACCOUNT_STOCKS_MOCK[0];
  }
}
