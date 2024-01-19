import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { StockService } from '../../service/stock.service';
import { HttpClientModule } from '@angular/common/http';
import { MarketStateService } from '../../service/market-state.service';
import { AssetMarketCardComponent } from '../asset-market-card/asset-market-card.component';
import { IPortfolioStock, IAsset } from '../../../../../../../domain/savings.domain';


const UI_COMPONENTS = [
  AssetMarketCardComponent
];

const MATERIAL_MODULES = [
  MatFormFieldModule,
  MatInputModule,
  MatIconModule,
  FormsModule,
];

@Component({
  selector: 'pgz-stock-market',
  standalone: true,
  imports: [UI_COMPONENTS, ...MATERIAL_MODULES, HttpClientModule],
  templateUrl: './stock-market.component.html',
  styleUrl: './stock-market.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [StockService]
})
export class StockMarketComponent implements AfterViewInit {
  
  public value = 'Clear me';
  public companies: IAsset[] = [];
  public moverFilters: Map<string, string> = new Map<string, string>([
    ['Most actives', 'MOST_ACTIVES'],
    ['Day gainers', 'DAY_GAINERS'],
    ['Day losers', 'DAY_LOSERS'],
  ]);
  public selectedFilter: string = 'MOST_ACTIVES';
  public selectedAssetIndex: number;

  constructor(
    private stockService: StockService, 
    private marketStateService: MarketStateService,
    private cdr: ChangeDetectorRef) { }

  public ngAfterViewInit(): void {
    
    this.stockService.getMovers(this.selectedFilter).subscribe(
      (response: IAsset[]) => {
        this.companies = response;
        this.cdr.detectChanges();
        
      },
      (error) => {
      console.error('Error', error);
    });
  }

  public onFilterChange() {
    this.stockService.getMovers(this.selectedFilter).subscribe(
      (response: IAsset[]) => {
        this.companies = response;
        this.cdr.detectChanges();
      },
      (error) => {
      console.error('Error', error);
    });
  }

  public onChoiseAsset(asset: IAsset, index: number): void {
    this.stockService.getCompany(asset.symbol).subscribe(val => {
      const newSome: IPortfolioStock = {...val,buyPrice: asset.price, count: 0,};
      this.marketStateService.choiseAsset(newSome);
    });
    this.selectedAssetIndex = index;
  }
}
