import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ICoin, IPortfolioCrypto } from '../../../../../../domain/savings.domain';
import { FormsModule } from '@angular/forms';
import { MarketService } from '../../../../service/market.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { IconComponent } from '../../../../../../core/UI/components/icon/icon.component';
import { SavingsService } from '../../../../../../service/savings.service';
import { PortfolioCoin } from '../../../../model/PortfolioCoin';
import { MarketCoinInfo } from '../../../../model/MarketCoinInfo';
import { Router } from '@angular/router';


const MATERIAL_MODULES = [
  MatIconModule, 
  FormsModule, 
  MatFormFieldModule, 
  MatInputModule,
];


@Component({
  selector: 'pgz-crypto-asset',
  standalone: true,
  imports: [...MATERIAL_MODULES, IconComponent],
  templateUrl: './crypto-asset.component.html',
  styleUrl: './crypto-asset.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CryptoAssetComponent implements OnInit, AfterViewInit, OnDestroy {
  public coinMarketInfo: ICoin;
  public portfolioCoin: IPortfolioCrypto;
  public editDisabled: boolean = true;
  public count: number = 0;
  
  constructor(
    private marketService: MarketService,
    private savingsService: SavingsService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) { }

  public ngOnInit(): void {
    if(this.marketService.isExistingAsset) {
      this.portfolioCoin = this.marketService.portfolioAsset$.value as PortfolioCoin;
      this.count = this.portfolioCoin.count;
    }
  }

  public ngAfterViewInit(): void {
    this.marketService.getAsset().subscribe(val => {
      this.coinMarketInfo = val as MarketCoinInfo;
      this.cdr.detectChanges();
    });
  }

  public saveEdit(): void {
    if(this.marketService.isExistingAsset) {
      this.savingsService.editAsset(this.portfolioCoin);
    } else {
      
      const newAsset: IPortfolioCrypto = PortfolioCoin.mapICoinToPortfolioCoin(this.coinMarketInfo);
      newAsset.count = this.count;
      this.savingsService.addSaving(newAsset);
    }

    this.router.navigate(['/savings']);
  }

  public ngOnDestroy(): void {
    this.marketService.destroyMarketState();
  }
}
