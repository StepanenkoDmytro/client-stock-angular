import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { IAccountStock } from 'src/app/domain/account.domain';
import { ACCOUNT_STOCKS_MOCK } from 'src/app/domain/mock.domain';

@Component({
  selector: 'app-holdings-stock',
  templateUrl: './holdings-stock.component.html',
  styleUrls: ['./holdings-stock.component.scss']
})
export class HoldingsStockComponent implements OnInit {
  
  public displayedColumns: string[] = [ 'name', 'countStocks', 'buyPrice', 'price', 'coast', 'sector', 'dividendYield', 'share', 'profit', 'growth', 'currency'];
  public dataSource!: MatTableDataSource<IAccountStock>;

  ngOnInit(): void {
    this.dataSource = new MatTableDataSource(ACCOUNT_STOCKS_MOCK);
  }
}
