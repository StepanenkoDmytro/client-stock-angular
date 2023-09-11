import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ACCOUNT_TRANSACTION_MOCK } from 'src/app/domain/mock.domain';
import { ITransact } from 'src/app/domain/transact.domain';

@Component({
  selector: 'app-expanded-info',
  templateUrl: './expanded-info.component.html',
  styleUrls: ['./expanded-info.component.scss']
})
export class ExpandedInfoComponent {
}
