import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { STOCKS_MOCK, PROFIT_MOCK, ACCOUNT_STOCKS_MOCK } from '../../domain/mock.domain';
import { IPortfolioStock } from '../../domain/savings.domain';
import { DonutComponent } from '../../core/UI/components/charts/donut/donut.component';
import { ButtonToggleComponent } from '../../core/UI/components/button-toggle/button-toggle.component';
import { BarComponent } from '../../core/UI/components/charts/bar/bar.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { SpendingStatisticComponent } from './spending-statistic/spending-statistic.component';
import { TotalBalanceComponent } from '../../core/UI/components/total-balance/total-balance.component';
import { SpendingsService } from '../../service/spendings.service';
import { ChartsHelperService } from '../../core/UI/components/charts/bar/charts-helper.service';
import { Spending } from '../spending/model/Spending';


const UI_COMPONENTS = [
  DonutComponent,
  ButtonToggleComponent,
  BarComponent,
  SpendingStatisticComponent,
  TotalBalanceComponent
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
    private spendingsService: SpendingsService,
  ) { }
  
  public ngOnInit(): void {
    this.spendingsService.init();
    this.spendingsService.getAll().subscribe(allSpendings => {
      this.spendings = allSpendings;
    });
  }

  public onChangeFrame(frame: boolean): void {
    this.isSpendingFrame = frame;
  }
  
}
