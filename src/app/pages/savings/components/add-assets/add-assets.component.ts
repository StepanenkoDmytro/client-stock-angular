import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {FormsModule} from '@angular/forms';
import { ACCOUNT_STOCKS_MOCK } from '../../../../domain/mock.domain';
import { IAsset, IPortfolioStock } from '../../../../domain/savings.domain';
import { AddAssetCardComponent } from './add-asset-card/add-asset-card.component';
import { StockService } from '../../service/stock.service';
import { HttpClientModule } from '@angular/common/http';
import { CoinService } from '../../service/coin.service';
import { StockSavingWrapperComponent } from '../stock-saving-wrapper/stock-saving-wrapper.component';
import { NgComponentOutlet } from '@angular/common';
import { StockMarketComponent } from './markets-assets/stock-market/stock-market.component';
import { CryptoMarketComponent } from './markets-assets/crypto-market/crypto-market.component';
import { MarketStateService } from './markets-assets/market-state.service';


const MATERIAL_MODULES = [
  MatExpansionModule,
  MatButtonModule,
  MatDatepickerModule,
  MatNativeDateModule,
  MatSelectModule,
  MatInputModule,
  MatIconModule,
  FormsModule,
  NgComponentOutlet,
];

@Component({
    selector: 'pgz-add-assets',
    standalone: true,
    templateUrl: './add-assets.component.html',
    styleUrl: './add-assets.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...MATERIAL_MODULES,],
})
export class AddAssetsComponent implements OnInit {
  public step = 0;
  
  public selectedTypeAssets: string = null;
  public assetMarketsComponents: { [key: string]: any  } = {
    'crypto': CryptoMarketComponent,
    'stock': StockMarketComponent,
  };
  public selectedAsset: IAsset;

  constructor(
    private marketStateService: MarketStateService
  ) { }

  public ngOnInit(): void {
    this.marketStateService.asset.subscribe((asset) => {
      this.selectedAsset = asset;
    });
  }

  public setStep(index: number) {
    this.step = index;
  }

  public nextStep() {
    this.step++;
  }

  public prevStep() {
    this.step--;
  }
}
