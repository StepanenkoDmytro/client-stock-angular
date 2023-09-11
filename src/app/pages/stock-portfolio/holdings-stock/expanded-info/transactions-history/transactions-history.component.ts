import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ACCOUNT_TRANSACTION_MOCK } from 'src/app/domain/mock.domain';
import { ITransact } from 'src/app/domain/transact.domain';


@Component({
  selector: 'app-transactions-history',
  templateUrl: './transactions-history.component.html',
  styleUrls: ['./transactions-history.component.scss']
})
export class TransactionsHistoryComponent {
  
  public displayedColumns: string[] = [ 'created', 'transactionType', 'quantity', 'price', 'amount', 'status', 'source'];
  public dataSource: MatTableDataSource<ITransact> = new MatTableDataSource(ACCOUNT_TRANSACTION_MOCK);
}
