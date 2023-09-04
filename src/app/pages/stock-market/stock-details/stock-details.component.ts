import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { IStock } from 'src/app/domain/assets.domain';
import { STOCK_MOCK } from 'src/app/domain/mock.domain';


export interface ElementTable {
  property: string,
  value: string | number | Date
}

@Component({
  selector: 'app-stock-details',
  templateUrl: './stock-details.component.html',
  styleUrls: ['./stock-details.component.scss']
})
export class StockDetailsComponent implements OnInit {
  public activeStock!: IStock;

  public displayedColumns: string[] = ['property', 'value'];
  public dataSource!: MatTableDataSource<ElementTable>;

  ngOnInit(): void {
    this.activeStock = STOCK_MOCK;

    const stockProperties: ElementTable[] = [
      { property: 'Symbol', value: this.activeStock.symbol },
      { property: 'Name', value: this.activeStock.name },
      { property: 'Currency', value: this.activeStock.currency },
      { property: 'Country', value: this.activeStock.country },
      { property: 'Sector', value: this.activeStock.sector },
      { property: 'Industry', value: this.activeStock.industry },
      { property: 'Market Capitalization', value: this.activeStock.market_capitalization.toString() + '$' },
      { property: 'Dividend Yield', value: this.activeStock.dividend_yield ? this.activeStock.dividend_yield.toString() : 'None' },
      { property: 'Dividend Date', value: this.activeStock.dividend_date !== undefined ? this.activeStock.dividend_date.toString() : 'None' },
      { property: 'Last Dividend Date', value: this.activeStock.ex_dividend_date !== undefined ? this.activeStock.ex_dividend_date.toString() : 'None' }
    ];

    this.dataSource = new MatTableDataSource(stockProperties);
  }
}
