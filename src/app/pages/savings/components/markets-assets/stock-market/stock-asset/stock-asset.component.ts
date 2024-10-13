import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ICompany, IPortfolioStock } from '../../../../../../domain/savings.domain';
import { FormsModule } from '@angular/forms';
import { MarketService } from '../../../../service/market.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { IconComponent } from '../../../../../../core/UI/components/icon/icon.component';
import { SavingsService } from '../../../../../../service/savings.service';
import { PortfolioStock } from '../../../../model/PortfolioStock';
import { MarketStockInfo } from '../../../../model/MarketStockInfo';
import { MatButtonModule } from '@angular/material/button';


const MATERIAL_MODULES = [
  MatIconModule, 
  FormsModule, 
  MatFormFieldModule, 
  MatInputModule,
  MatButtonModule
];

@Component({
  selector: 'pgz-stock-asset',
  standalone: true,
  imports: [...MATERIAL_MODULES, IconComponent],
  templateUrl: './stock-asset.component.html',
  styleUrls: ['./stock-asset.component.scss', '../../market-assets.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StockAssetComponent implements OnInit, AfterViewInit, OnDestroy {
  public marketInfo: ICompany;
  public portfolioStock: IPortfolioStock;
  public editDisabled: boolean = true;
  public count: number = 0;
  
  constructor(
    private marketService: MarketService,
    private savingsService: SavingsService,
    private cdr: ChangeDetectorRef
  ) { }

  public ngOnInit(): void {
    if(this.marketService.isExistingAsset) {
      this.portfolioStock = this.marketService.portfolioAsset$.value as PortfolioStock;
      this.count = this.portfolioStock.count;
    }
  }

  public ngAfterViewInit(): void {
    this.marketService.getAsset().subscribe(val => {
      this.marketInfo = val as MarketStockInfo;
      this.cdr.detectChanges();
    });
  }

  public saveEdit(): void {
    if(this.marketService.isExistingAsset) {
      this.savingsService.editAsset(this.portfolioStock);
    } else {
      const newAsset: IPortfolioStock = PortfolioStock.mapICompanyToPortfolioStock(this.marketInfo);
      newAsset.count = this.count;
      this.savingsService.addSaving(newAsset);
    }
  }

  public ngOnDestroy(): void {
    this.marketService.destroyMarketState();
  }
}
