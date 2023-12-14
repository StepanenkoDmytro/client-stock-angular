import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ProgressComponent } from '../../core/UI/components/progress/progress.component';
import { TotalBalanceComponent } from './components/total-balance/total-balance.component';
import { PeriodSpendingComponent } from './components/period-spending/period-spending.component';
import { MatButtonModule } from '@angular/material/button';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { AddSpendingComponent } from './components/add-spending/add-spending.component';

const UI_COMPONENTS = [
  ProgressComponent,
  TotalBalanceComponent,
  PeriodSpendingComponent,
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

  constructor(
    private _bottomSheet: MatBottomSheet
  ) { }

  public addSpending(): void {
    this._bottomSheet.open(AddSpendingComponent);
  }
}
