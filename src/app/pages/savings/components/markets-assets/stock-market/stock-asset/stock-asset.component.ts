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


const MATERIAL_MODULES = [
  MatIconModule, 
  FormsModule, 
  MatFormFieldModule, 
  MatInputModule
];


@Component({
  selector: 'pgz-stock-asset',
  standalone: true,
  imports: [...MATERIAL_MODULES, IconComponent],
  templateUrl: './stock-asset.component.html',
  styleUrl: './stock-asset.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StockAssetComponent implements OnInit, AfterViewInit, OnDestroy {
  public coinMarketInfo: ICompany;
  public portfolioStock: IPortfolioStock;
  public editDisabled: boolean = true;
  public count: number = 0;
  
  constructor(
    private MarketService: MarketService,
    private savingsService: SavingsService,
    private cdr: ChangeDetectorRef
  ) { }

  public ngOnInit(): void {
    if(this.MarketService.isExistingAsset) {
      this.portfolioStock = this.MarketService.portfolioAsset$.value as PortfolioStock;
      this.count = this.portfolioStock.count;
    }
  }

  public ngAfterViewInit(): void {
    this.MarketService.getAsset().subscribe(val => {
      this.coinMarketInfo = val as MarketStockInfo;
      this.cdr.detectChanges();
    });
  }

  public saveEdit(): void {
    if(this.MarketService.isExistingAsset) {
      this.savingsService.editAsset(this.portfolioStock);
    } else {
      const newAsset: IPortfolioStock = PortfolioStock.mapICompanyToPortfolioStock(this.coinMarketInfo);
      newAsset.count = this.count;
      this.savingsService.addSaving(newAsset);
    }
  }

  public ngOnDestroy(): void {
    this.MarketService.destroyMarketState();
  }
}
