import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ProgressComponent } from '../../core/UI/components/progress/progress.component';
import { PeriodSpendingComponent } from './components/period-spending/period-spending.component';
import { MatButtonModule } from '@angular/material/button';
import { ButtonToggleComponent } from '../../core/UI/components/button-toggle/button-toggle.component';
import { HistorySpendingComponent } from './components/history-spending/history-spending.component';
import { ID3Value } from '../../domain/d3.domain';
import { SpendingsService } from '../../service/spendings.service';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { TotalBalanceSpendingComponent } from './components/total-balance-spending/total-balance-spending.component';
import { Spending } from './model/Spending';
import { combineLatest } from 'rxjs';


const UI_COMPONENTS = [
  ProgressComponent,
  TotalBalanceSpendingComponent,
  PeriodSpendingComponent,
  HistorySpendingComponent,
  ButtonToggleComponent,
];

const MATERIAL_MODULES = [
  MatButtonModule,
  MatIconModule,
];


@Component({
  selector: 'pgz-spending',
  templateUrl: './spending.component.html',
  styleUrl: './spending.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [ ...UI_COMPONENTS, ...MATERIAL_MODULES, RouterModule],
})
export class SpendingComponent implements OnInit {
  public expends: ID3Value = {
    title: 'Spending by day',
    money: 0,
  };

  public spendings: Spending[];
  public isSpendingsFrame: boolean = true;

  constructor(
    public spendingsService: SpendingsService,
    private cdr: ChangeDetectorRef
  ) { }

  public ngOnInit(): void {
    this.spendingsService.init(); 
    combineLatest([
      this.spendingsService.getSpentByDay(),
      this.spendingsService.loadByCurrentMonth()
    ]).subscribe(([spentByDay, spendings]) => {
      this.expends = {...this.expends, money: spentByDay};
      this.spendings = spendings;

      this.cdr.detectChanges();
    });
  }

  public onChangeFrame(frame: boolean): void {
    this.isSpendingsFrame = frame;
  }
}
