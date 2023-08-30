import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { IStock } from 'src/app/domain/assets.domain';
import { STOCK_MOCK } from 'src/app/domain/mock.domain';


@Component({
  selector: 'app-stock-details',
  templateUrl: './stock-details.component.html',
  styleUrls: ['./stock-details.component.scss']
})
export class StockDetailsComponent implements OnInit {
  public displayedColumns: string[] = [ 'column name', 'column value'];
  public activeStock!: IStock;

  ngOnInit(): void {
    this.activeStock = STOCK_MOCK;
  }
}
