import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {FormsModule} from '@angular/forms';
import { IAsset } from '../../../../domain/savings.domain';
import { NgComponentOutlet } from '@angular/common';
import { StockMarketComponent } from '../markets-assets/components/stock-market/stock-market.component';
import { CryptoMarketComponent } from '../markets-assets/components/crypto-market/crypto-market.component';
import { MarketStateService } from '../markets-assets/service/market-state.service';
import { SavingsService } from '../../../../service/savings.service';
import { Router, RouterModule } from '@angular/router';


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
    imports: [...MATERIAL_MODULES, RouterModule],
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
    private marketStateService: MarketStateService,
    private savingsService: SavingsService,
    private router: Router
  ) { }

  public ngOnInit(): void {
    this.marketStateService.asset.subscribe(asset => {
      this.selectedAsset = asset;
    })
  }

  public setStep(index: number) {
    this.step = index;
  }

  public nextStep() {
    this.step++;

    if(this.step > 2) {
      const newAsset = this.selectedAsset;
      
      this.savingsService.addSavings(newAsset);
      this.router.navigate(['savings']);
    }
  }

  public prevStep() {
    this.step--;
  }
}
