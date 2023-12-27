import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TotalInfoComponent } from './components/total-info/total-info.component';
import { ButtonToggleComponent } from '../../core/UI/components/button-toggle/button-toggle.component';
import {MatIconModule} from '@angular/material/icon';
import {MatTabsModule} from '@angular/material/tabs';
import { StockSavingComponent } from './components/stock-saving-wrapper/stock-saving/stock-saving.component';
import { StockStatisticComponent } from './components/stock-saving-wrapper/stock-statistic/stock-statistic.component';
import { ACCOUNT_STOCKS_MOCK } from '../../domain/mock.domain';
import { IPortfolioStock } from '../../domain/savings.domain';
import { MatFormFieldModule } from '@angular/material/form-field';


const UI_COMPONENTS = [
  TotalInfoComponent,
  ButtonToggleComponent,
  StockSavingComponent,
  ButtonToggleComponent,
  StockStatisticComponent,
];

const MATERIAL_MODULES = [
  MatIconModule,
  MatTabsModule,
  MatFormFieldModule
];

@Component({
  selector: 'pgz-savings',
  standalone: true,
  imports: [...UI_COMPONENTS, ...MATERIAL_MODULES],
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
