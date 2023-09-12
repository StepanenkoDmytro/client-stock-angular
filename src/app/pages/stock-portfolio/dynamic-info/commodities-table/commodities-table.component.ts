import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { COMMODITY_MOCKS } from 'src/app/domain/mock.domain';
import { ICommodityTable } from 'src/app/domain/widget.domain';


@Component({
  selector: 'app-commodities-table',
  templateUrl: './commodities-table.component.html',
  styleUrls: ['./commodities-table.component.scss']
})
export class CommoditiesTableComponent {

  public displayedCommodityColumns: string[] = ['commodity', 'price', 'change', 'percentageChange'];
  public commodityDataSource: MatTableDataSource<ICommodityTable> = new MatTableDataSource(COMMODITY_MOCKS);
}
