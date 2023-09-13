import { state, style, trigger } from '@angular/animations';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { IPortfolioStock } from 'src/app/domain/portfolio.domain';
import { IStock } from 'src/app/domain/assets.domain';


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
export class HoldingsStockComponent implements OnChanges {
  
  @Input()
  public stocks: IPortfolioStock[] = [];
  
  public displayedColumns: string[] = [ 'name', 'countStocks', 'buyPrice', 'price', 'coast', 'sector', 'dividendYield', 'share', 'profit', 'growth', 'currency'];
  public columnsToDisplayWithExpand = [...this.displayedColumns, 'expand'];
  public expandedElement: IStock | null = null;
  public dataSource: MatTableDataSource<IPortfolioStock> | [] = [];

  public ngOnChanges(changes: SimpleChanges): void {
    if(changes['stocks']) {
      this.dataSource = new MatTableDataSource(changes['stocks'].currentValue);
    }
  }
}
