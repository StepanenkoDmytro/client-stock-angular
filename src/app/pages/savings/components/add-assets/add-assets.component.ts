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
import { IPortfolioStock } from '../../../../domain/savings.domain';
import { AddAssetCardComponent } from './add-asset-card/add-asset-card.component';
import { StockService } from '../../service/stock.service';
import { HttpClientModule } from '@angular/common/http';
import { CoinService } from '../../service/coin.service';


const UI_COMPONENTS = [
  AddAssetCardComponent
];

const MATERIAL_MODULES = [
  MatExpansionModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    FormsModule,
];

@Component({
    selector: 'pgz-add-assets',
    standalone: true,
    templateUrl: './add-assets.component.html',
    styleUrl: './add-assets.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...UI_COMPONENTS, ...MATERIAL_MODULES, HttpClientModule],
    providers: [StockService, CoinService]
})
export class AddAssetsComponent implements OnInit {
  public step = 0;
  public value = 'Clear me';
  public stocks: IPortfolioStock[] = ACCOUNT_STOCKS_MOCK;

  constructor(private stockService: StockService,
    private coinService: CoinService) { }

  public ngOnInit(): void {
    this.coinService.getCoins().subscribe(
      (response) => {
        // const resp: IAssets = {
        //   assetType: AssetsType.COIN,
        //   symbol: response.symbol,
        //   name: response.name,
        //   count: 0,
        //   avgPrice: response.price,
        // };
        console.log('Success', response);
      },
    (error) => {
    console.error('Error', error);
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
