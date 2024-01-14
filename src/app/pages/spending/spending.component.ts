import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ProgressComponent } from '../../core/UI/components/progress/progress.component';
import { TotalBalanceComponent } from './components/total-balance/total-balance.component';
import { PeriodSpendingComponent } from './components/period-spending/period-spending.component';
import { MatButtonModule } from '@angular/material/button';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { AddSpendingComponent } from './components/add-spending/add-spending.component';
import { ButtonToggleComponent } from '../../core/UI/components/button-toggle/button-toggle.component';
import { HistorySpendingComponent } from './components/history-spending/history-spending.component';
import { ID3Value } from '../../domain/d3.domain';
import { ISpending } from '../../domain/spending.domain';
import { ExpenseService } from '../../service/expense.service';
import { switchMap } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';


const UI_COMPONENTS = [
  ProgressComponent,
  TotalBalanceComponent,
  PeriodSpendingComponent,
  HistorySpendingComponent,
  ButtonToggleComponent,
];

const MATERIAL_MODULES = [
  MatButtonModule,
  MatBottomSheetModule,
  MatIconModule,
];

@Component({
  selector: 'pgz-spending',
  templateUrl: './spending.component.html',
  styleUrl: './spending.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [ ...UI_COMPONENTS, ...MATERIAL_MODULES, RouterModule ],
})
export class SpendingComponent implements OnInit {
  public expends: ID3Value = {
    title: 'Total',
    money: '2 000 000',
  };

  public historySpending: ISpending[] = [];
  public isSpendingsFrame: boolean = true;

  constructor(
    private _bottomSheet: MatBottomSheet,
    private expenseService: ExpenseService,
  ) { }

  public ngOnInit(): void {
    this.expenseService.loadByCurrentMonth().subscribe(spendings => {
      this.historySpending = spendings;
    });
  }

  public addSpending(): void {
    this._bottomSheet.open(AddSpendingComponent).backdropClick().pipe(
      switchMap(() => this.expenseService.loadByCurrentMonth())
    ).subscribe(spendings => {
      this.historySpending = spendings;
    });
  }

  public onChangeFrame(frame: boolean): void {
    this.isSpendingsFrame = frame;
  }
}
