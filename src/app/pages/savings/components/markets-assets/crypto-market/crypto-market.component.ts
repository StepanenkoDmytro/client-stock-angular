import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CoinService } from '../../../service/coin.service';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MarketService } from '../../../service/market.service';
import { AssetMarketCardComponent } from '../asset-market-card/asset-market-card.component';
import { ICoin } from '../../../../../domain/savings.domain';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';


const UI_COMPONENTS = [
  AssetMarketCardComponent
];

const MATERIAL_MODULES = [
  MatFormFieldModule,
  MatInputModule,
  MatIconModule,
  FormsModule,
  MatButtonModule
];

@Component({
  selector: 'pgz-crypto-market',
  standalone: true,
  imports: [...UI_COMPONENTS, ...MATERIAL_MODULES, HttpClientModule, RouterModule],
  templateUrl: './crypto-market.component.html',
  styleUrl: './crypto-market.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CoinService]
})
export class CryptoMarketComponent implements OnInit {

  public filter: string = '';
  public coins: ICoin[] = [];
  public selectedAssetIndex: number;
  public assetsCount: number = 0;

  constructor(
    private coinService: CoinService, 
    private MarketService: MarketService,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) { }

  public ngOnInit(): void {
    this.sendRequest();
  }

  public onFilterChange(): void {
    this.sendRequest();
  }

  private sendRequest(): void {
    this.coinService.getCoinList(this.filter).subscribe(
      (response) => {
        this.coins = response.data;
        this.assetsCount = response.totalItems;
        
        this.cdr.detectChanges();
      },
      (error) => {
      console.error('Error', error);
    });
  }

  public onChoiseAsset(asset: ICoin, index: number): void {
    this.selectedAssetIndex = index;
    this.MarketService.selectAsset(asset);
  }

  public goToAsset(): void {
    this.router.navigate(['/savings/crypto-asset']);
  }
}
