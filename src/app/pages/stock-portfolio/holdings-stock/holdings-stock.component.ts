import { state, style, trigger } from '@angular/animations';
import { Component } from '@angular/core';
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
    ]),
  ],
})
export class HoldingsStockComponent {
  
  public displayedColumns: string[] = [ 'name', 'countStocks', 'buyPrice', 'price', 'coast', 'sector', 'dividendYield', 'share', 'profit', 'growth', 'currency'];
  public columnsToDisplayWithExpand = [...this.displayedColumns, 'expand'];
  public expandedElement: IStock | null = null;
  public dataSource: MatTableDataSource<IAccountStock> = new MatTableDataSource(ACCOUNT_STOCKS_MOCK);
}
