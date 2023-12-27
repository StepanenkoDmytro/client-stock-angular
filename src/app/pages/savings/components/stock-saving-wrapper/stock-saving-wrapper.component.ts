import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ButtonToggleComponent } from '../../../../core/UI/components/button-toggle/button-toggle.component';
import { TotalInfoComponent } from '../total-info/total-info.component';
import { StockSavingComponent } from './stock-saving/stock-saving.component';
import { StockStatisticComponent } from './stock-statistic/stock-statistic.component';
import { ACCOUNT_STOCKS_MOCK } from '../../../../domain/mock.domain';
import { IPortfolioStock } from '../../../../domain/savings.domain';


const UI_COMPONENTS = [
  TotalInfoComponent,
  StockSavingComponent,
  ButtonToggleComponent,
  StockStatisticComponent,
];

@Component({
  selector: 'pgz-stock-saving-wrapper',
  standalone: true,
  imports: [...UI_COMPONENTS],
  templateUrl: './stock-saving-wrapper.component.html',
  styleUrl: './stock-saving-wrapper.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StockSavingWrapperComponent {
  public stocks: IPortfolioStock[] = ACCOUNT_STOCKS_MOCK;
  public isPortfolioFrame: boolean = true;

  public onChangeFrame(frame: boolean): void {
    this.isPortfolioFrame = frame;
  }
}
