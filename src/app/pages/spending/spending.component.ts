import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ProgressComponent } from '../../core/UI/components/progress/progress.component';
import { TotalBalanceComponent } from './components/total-balance/total-balance.component';
import { PeriodSpendingComponent } from './components/period-spending/period-spending.component';
import { MatButtonModule } from '@angular/material/button';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { AddSpendingComponent } from './components/add-spending/add-spending.component';
import { ButtonToggleComponent } from '../../core/UI/components/button-toggle/button-toggle.component';
import { HistorySpendingComponent } from './components/history-spending/history-spending.component';
import { ID3Value } from '../../core/domain/d3.domain';
import { ISpending } from '../../core/domain/spending.domain';
import moment from 'moment';

const UI_COMPONENTS = [
  ProgressComponent,
  TotalBalanceComponent,
  PeriodSpendingComponent,
  HistorySpendingComponent,
  ButtonToggleComponent,
];
const MATERIAL_MODULES = [
  MatButtonModule,
  MatBottomSheetModule
];

@Component({
  selector: 'pgz-spending',
  templateUrl: './spending.component.html',
  styleUrl: './spending.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [ ...UI_COMPONENTS, ...MATERIAL_MODULES ],
})
export class SpendingComponent {
  public expends: ID3Value = {
    title: 'Total',
    money: '2 000 000',
  };

  public historySpending: ISpending[] = [
    {
      id: 1,
      icon: 'assets/expend/pet.svg',
      title: 'Pet',
      cost: 10,
      date: moment().toDate(),
    },
    {
      id: 2,
      icon: 'assets/expend/clothes.svg',
      title: 'T-shirt',
      cost: 50,
      date: moment().toDate(),
    },
    {
      id: 3,
      icon: 'assets/expend/pet.svg',
      title: 'Pet',
      cost: 10,
      date: moment().subtract(6, 'days').toDate(),
    },
    {
      id: 4,
      icon: 'assets/expend/clothes.svg',
      title: 'T-shirt',
      cost: 50,
      date: moment().subtract(5, 'days').toDate(),
    },
    {
      id: 5,
      icon: 'assets/expend/pet.svg',
      title: 'Pet',
      cost: 10,
      date: moment().subtract(1, 'month').toDate(),
    },
  ]
  public isSpendingsFrame: boolean = true;

  constructor(
    private _bottomSheet: MatBottomSheet
  ) { }

  public addSpending(): void {
    this._bottomSheet.open(AddSpendingComponent);
  }

  
  public onChangeFrame(frame: boolean): void {
    this.isSpendingsFrame = frame;
  }
}
