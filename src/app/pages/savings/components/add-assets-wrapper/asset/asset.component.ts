import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { IAsset, ICoin, IMarket, IPortfolioCrypto } from '../../../../../domain/savings.domain';
import { FormsModule } from '@angular/forms';
import { MarketStateService } from '../service/market-state.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { IconComponent } from '../../../../../core/UI/components/icon/icon.component';
import { SavingsService } from '../../../../../service/savings.service';
import { PortfolioCoin } from '../markets-assets/model/PortfolioCoin';
import { MarketCoinInfo } from '../markets-assets/model/MarketCoinInfo';
import { of, switchMap } from 'rxjs';
import { CoinService } from '../service/coin.service';


const MATERIAL_MODULES = [
  MatIconModule, 
  FormsModule, 
  MatFormFieldModule, 
  MatInputModule
];

@Component({
  selector: 'pgz-asset',
  standalone: true,
  imports: [...MATERIAL_MODULES, IconComponent],
  templateUrl: './asset.component.html',
  styleUrl: './asset.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssetComponent implements OnInit, AfterViewInit {
  public coinMarketInfo: ICoin;
  public portfolioCoin: IPortfolioCrypto;
  public editDisabled: boolean = true;
  public count: number;
  
  constructor(
    private marketStateService: MarketStateService,
    private savingsService: SavingsService,
    private coinService: CoinService,
    private cdr: ChangeDetectorRef
  ) { }

  public ngOnInit(): void {
    // if(this.marketStateService.isExistingAsset && this.coinMarketInfo) {
    //   console.log('findCoinMarketInfo');
    //   this.marketStateService.findCoinMarketInfo(this.coinMarketInfo).subscribe(val => {
    //     console.log('findCoinMarketInfo',val);
    //   })
    // }
    console.log(this.marketStateService.isExistingAsset)
    if(this.marketStateService.isExistingAsset) {
      this.portfolioCoin = this.marketStateService.portfolioAsset$.value as PortfolioCoin;
      console.log('this.portfolioCoin',this.portfolioCoin)
    }
  }

  public ngAfterViewInit(): void {
    this.marketStateService.getAsset().subscribe(val => {
      this.coinMarketInfo = val as MarketCoinInfo;
      
      this.cdr.detectChanges();

    })
  }

  public saveEdit(): void {
    if(this.marketStateService.isExistingAsset) {
      this.savingsService.editAsset(this.portfolioCoin);
    } else {
      const newAsset = PortfolioCoin.mapICoinToPortfolioCoin(this.coinMarketInfo);
      console.log('saveEdit in AssetComponent', newAsset);
      this.savingsService.addSaving(newAsset);
    }
  }
}
