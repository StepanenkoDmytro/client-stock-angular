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
import { CoinService } from './components/add-assets/markets-assets/service/coin.service';
import { HttpClientModule } from '@angular/common/http';
import { AddAssetsComponent } from './components/add-assets/add-assets.component';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { SavingsService } from '../../service/savings.service';


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
  MatFormFieldModule,
  MatButtonModule,
  MatBottomSheetModule
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

  constructor(
    private savingsService: SavingsService,
    private _bottomSheet: MatBottomSheet,
  ) { }
  
  public ngOnInit(): void {
    this.savingsService.getAll().subscribe(val => {
      console.log(val);
      
    });
  }

  public onChangeFrame(frame: boolean): void {
    this.isPortfolioFrame = frame;
  }

  public addSaving(): void {
    this._bottomSheet.open(AddAssetsComponent);
  }
}
