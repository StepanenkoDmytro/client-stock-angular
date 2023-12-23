import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IPortfolioStock } from '../../domain/savings.domain';
import { ACCOUNT_STOCKS_MOCK } from '../../domain/mock.domain';
import { TotalInfoComponent } from './components/total-info/total-info.component';
import { StockSavingComponent } from './components/stock-saving/stock-saving.component';
import { ButtonToggleComponent } from '../../core/UI/components/button-toggle/button-toggle.component';
import { StockStatisticComponent } from './components/stock-statistic/stock-statistic.component';


const UI_COMPONENTS = [
  TotalInfoComponent,
  StockSavingComponent,
  ButtonToggleComponent,
  StockStatisticComponent,
];

@Component({
  selector: 'pgz-savings',
  standalone: true,
  imports: [...UI_COMPONENTS],
  templateUrl: './savings.component.html',
  styleUrl: './savings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SavingsComponent {
  public stocks: IPortfolioStock[] = ACCOUNT_STOCKS_MOCK;
  public isPortfolioFrame: boolean = true;

  public onChangeFrame(frame: boolean): void {
    this.isPortfolioFrame = frame;
  }
}
