import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { DonutComponent } from '../../core/UI/components/charts/donut/donut.component';
import { ButtonToggleComponent } from '../../core/UI/components/button-toggle/button-toggle.component';
import { BarComponent } from '../../core/UI/components/charts/bar/bar.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { SpendingStatisticComponent } from './components/spending-statistic/spending-statistic.component';
import { TotalBalanceComponent } from '../../core/UI/components/total-balance/total-balance.component';
import { Spending } from '../spending/model/Spending';
import { SavingsStatisticComponent } from './components/savings-statistic/savings-statistic.component';


const UI_COMPONENTS = [
  DonutComponent,
  ButtonToggleComponent,
  BarComponent,
  SpendingStatisticComponent,
  TotalBalanceComponent,
  SavingsStatisticComponent
];

const MATERIAL_MODULES = [
  MatTabsModule,
  MatExpansionModule,
  MatIconModule
];

@Component({
  selector: 'pgz-statistic',
  standalone: true,
  imports: [...UI_COMPONENTS, ...MATERIAL_MODULES],
  templateUrl: './statistic.component.html',
  styleUrl: './statistic.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatisticComponent implements OnInit {
  public spendings: Spending[];
  public isSpendingFrame: boolean = true;

  constructor(
  ) { }
  
  public ngOnInit(): void {
    
  }

  public onChangeFrame(frame: boolean): void {
    this.isSpendingFrame = frame;
  }
  
}
