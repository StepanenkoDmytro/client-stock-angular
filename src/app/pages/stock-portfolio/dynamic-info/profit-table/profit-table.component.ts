import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ElementTable } from '../../stock-market/stock-details/stock-details.component';
import { PROFITS_VALUE_MOCK } from 'src/app/domain/mock.domain';


@Component({
  selector: 'app-profit-table',
  templateUrl: './profit-table.component.html',
  styleUrls: ['./profit-table.component.scss']
})
export class ProfitTableComponent {

  public displayedColumns: string[] = ['property', 'value'];
  public dataSourceProfit: MatTableDataSource<ElementTable> = new MatTableDataSource(PROFITS_VALUE_MOCK); 
}
