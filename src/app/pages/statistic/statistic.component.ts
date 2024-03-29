import { ChangeDetectionStrategy, Component } from '@angular/core';
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
export class StatisticComponent {
  public stocksMock = STOCKS_MOCK;
  public profitMock = PROFIT_MOCK;
  public stocks: IPortfolioStock[] = ACCOUNT_STOCKS_MOCK;
  years: string[] = ['2022', '2023', '2024']; // Додайте необхідні роки
  months: string[] = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  public isSpendingFrame: boolean = true;

  public onChangeFrame(frame: boolean): void {
    this.isSpendingFrame = frame;
  }

  public trackYear(index: number, year: string): string {
    return year;
  }
}
