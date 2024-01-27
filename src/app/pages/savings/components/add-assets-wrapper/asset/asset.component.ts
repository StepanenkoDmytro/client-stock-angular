import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ICoin, IPortfolioCrypto } from '../../../../../domain/savings.domain';
import { FormsModule } from '@angular/forms';
import { MarketStateService } from '../service/market-state.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { IconComponent } from '../../../../../core/UI/components/icon/icon.component';
import { SavingsService } from '../../../../../service/savings.service';
import { PortfolioCoin } from '../markets-assets/model/PortfolioCoin';
import { MarketCoinInfo } from '../markets-assets/model/MarketCoinInfo';
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
export class AssetComponent implements OnInit, AfterViewInit, OnDestroy {
  public coinMarketInfo: ICoin;
  public portfolioCoin: IPortfolioCrypto;
  public editDisabled: boolean = true;
  public count: number = 0;
  
  constructor(
    private marketStateService: MarketStateService,
    private savingsService: SavingsService,
    private cdr: ChangeDetectorRef
  ) { }

  public ngOnInit(): void {
    if(this.marketStateService.isExistingAsset) {
      this.portfolioCoin = this.marketStateService.portfolioAsset$.value as PortfolioCoin;
      this.count = this.portfolioCoin.count;
    }
  }

  public ngAfterViewInit(): void {
    this.marketStateService.getAsset().subscribe(val => {
      this.coinMarketInfo = val as MarketCoinInfo;
      this.cdr.detectChanges();
    });
  }

  public saveEdit(): void {
    if(this.marketStateService.isExistingAsset) {
      this.savingsService.editAsset(this.portfolioCoin);
    } else {
      const newAsset: IPortfolioCrypto = PortfolioCoin.mapICoinToPortfolioCoin(this.coinMarketInfo);
      newAsset.count = this.count;
      this.savingsService.addSaving(newAsset);
    }
  }

  public ngOnDestroy(): void {
    this.marketStateService.destroyMarketState();
  }
}
