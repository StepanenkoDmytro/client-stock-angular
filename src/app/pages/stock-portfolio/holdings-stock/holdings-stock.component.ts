import { state, style, trigger } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { IAccountStock } from 'src/app/domain/account.domain';
import { IStock } from 'src/app/domain/assets.domain';
import { ACCOUNT_STOCKS_MOCK } from 'src/app/domain/mock.domain';

@Component({
  selector: 'app-holdings-stock',
  templateUrl: './holdings-stock.component.html',
  styleUrls: ['./holdings-stock.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      // transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class HoldingsStockComponent implements OnInit {
  
  public displayedColumns: string[] = [ 'name', 'countStocks', 'buyPrice', 'price', 'coast', 'sector', 'dividendYield', 'share', 'profit', 'growth', 'currency'];
  public columnsToDisplayWithExpand = [...this.displayedColumns, 'expand'];
  public expandedElement: IStock | null = null;
  public dataSource!: MatTableDataSource<IAccountStock>;

  ngOnInit(): void {
    console.log(this.expandedElement);
    this.dataSource = new MatTableDataSource(ACCOUNT_STOCKS_MOCK);
  }
}
