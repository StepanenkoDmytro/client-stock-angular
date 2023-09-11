import { Component } from '@angular/core';
import { ICommodityTable } from '../dynamic-info.component';
import { MatTableDataSource } from '@angular/material/table';
import { COMMODITY_MOCKS } from 'src/app/domain/mock.domain';


@Component({
  selector: 'app-commodities-table',
  templateUrl: './commodities-table.component.html',
  styleUrls: ['./commodities-table.component.scss']
})
export class CommoditiesTableComponent {

  public displayedColumnsCommodity: string[] = ['commodity', 'price', 'change', 'percentageChange'];
  public dataSourceCommodity: MatTableDataSource<ICommodityTable> = new MatTableDataSource(COMMODITY_MOCKS);
}
