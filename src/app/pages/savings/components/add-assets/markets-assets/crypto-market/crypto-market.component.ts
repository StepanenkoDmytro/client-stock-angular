import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CoinService } from '../../../../service/coin.service';
import { HttpClientModule } from '@angular/common/http';
import { IAsset } from '../../../../../../domain/savings.domain';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AddAssetCardComponent } from '../../add-asset-card/add-asset-card.component';


const UI_COMPONENTS = [
  AddAssetCardComponent
];

const MATERIAL_MODULES = [
  MatFormFieldModule,
  MatInputModule,
  MatIconModule,
  FormsModule,
];
@Component({
  selector: 'pgz-crypto-market',
  standalone: true,
  imports: [...UI_COMPONENTS, ...MATERIAL_MODULES, HttpClientModule],
  templateUrl: './crypto-market.component.html',
  styleUrl: './crypto-market.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CoinService]
})
export class CryptoMarketComponent implements OnInit {

  public filter: string = '';
  public coins: IAsset[] = [];
  public assetsCount: number = 0;

  constructor(
    private coinService: CoinService, 
    private cdr: ChangeDetectorRef) { }

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
        console.log(response);
        
        this.cdr.detectChanges();
      },
      (error) => {
      console.error('Error', error);
    });
  }
}
