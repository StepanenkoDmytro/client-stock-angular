import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { TotalInfoComponent } from './components/total-info/total-info.component';
import { ButtonToggleComponent } from '../../core/UI/components/button-toggle/button-toggle.component';
import {MatIconModule} from '@angular/material/icon';
import {MatTabsModule} from '@angular/material/tabs';
import { StockSavingComponent } from './components/stock-saving-wrapper/stock-saving/stock-saving.component';
import { StockStatisticComponent } from './components/stock-saving-wrapper/stock-statistic/stock-statistic.component';
import { ACCOUNT_STOCKS_MOCK } from '../../domain/mock.domain';
import { IPortfolioStock } from '../../domain/savings.domain';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CoinService } from './service/coin.service';
import { HttpClientModule } from '@angular/common/http';


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

enum AssetsType {
  COIN,
  STOCK,
}

interface IAssets {
  assetType: AssetsType,
  symbol: string,
  name: string,
  count: number,
  avgPrice: number,
  created?: Date,
  updated?: Date
};

@Component({
  selector: 'pgz-savings',
  standalone: true,
  imports: [...UI_COMPONENTS, ...MATERIAL_MODULES, HttpClientModule],
  templateUrl: './savings.component.html',
  styleUrl: './savings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CoinService],
})
export class SavingsComponent implements OnInit {
  public stocks: IPortfolioStock[] = ACCOUNT_STOCKS_MOCK;
  public isPortfolioFrame: boolean = true;

  constructor(private coinService: CoinService) {}
  
  public ngOnInit(): void {
  //  this.coinService.test().subscribe((response) => {
    
  //   const resp: IAssets = {
  //     assetType: AssetsType.COIN,
  //     symbol: response.symbol,
  //     name: response.name,
  //     count: 0,
  //     avgPrice: response.price,
  //   };
  //   console.log('Success', response);
  // },
  // (error) => {
  //   console.error('Error', error);
  // });
  }

  public onChangeFrame(frame: boolean): void {
    this.isPortfolioFrame = frame;
  }
}
