import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { StockService } from '../../../service/stock.service';
import { HttpClientModule } from '@angular/common/http';
import { MarketService } from '../../../service/market.service';
import { AssetMarketCardComponent } from '../asset-market-card/asset-market-card.component';
import { IPortfolioStock, IAsset, IMarket, ICompanyList } from '../../../../../domain/savings.domain';
import { StockAssetComponent } from './stock-asset/stock-asset.component';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { PrevRouteComponent } from '../../prev-route/prev-route.component';


const UI_COMPONENTS = [
  AssetMarketCardComponent,
  StockAssetComponent,
  PrevRouteComponent
];

const MATERIAL_MODULES = [
  MatFormFieldModule,
  MatInputModule,
  MatIconModule,
  FormsModule,
  MatButtonModule
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
  public companies: IMarket[] = [];
  public moverFilters: Map<string, string> = new Map<string, string>([
    ['Most actives', 'MOST_ACTIVES'],
    ['Day gainers', 'DAY_GAINERS'],
    ['Day losers', 'DAY_LOSERS'],
  ]);
  public selectedFilter: string = 'MOST_ACTIVES';

  constructor(
    private stockService: StockService, 
    private marketService: MarketService,
    private cdr: ChangeDetectorRef,
    private router: Router,) { }

  public ngAfterViewInit(): void {
    
    this.stockService.getCompaniesList(0).subscribe(
      (response: ICompanyList) => {
        this.companies = [...response.data];
        this.cdr.detectChanges();
        
      },
      (error) => {
      console.error('Error', error);
    });
  }

  public onFilterChange() {
    // this.stockService.getMovers(this.selectedFilter).subscribe(
    //   (response: IAsset[]) => {
    //     this.companies = response;
    //     this.cdr.detectChanges();
    //   },
    //   (error) => {
    //   console.error('Error', error);
    // });
  }

  public onChoiseAsset(asset: IAsset): void {
    this.stockService.getCompany(asset.symbol).subscribe(val => {
      const newSome: IPortfolioStock = {...val,buyPrice: asset.price, count: 0,};
      this.marketService.selectAsset(newSome);
    });
  }

  public goToAsset(): void {
    this.router.navigate(['/savings/stock-asset']);
  }
}
