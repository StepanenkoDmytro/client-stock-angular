import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, switchMap, withLatestFrom } from 'rxjs';
import { IAsset, ICoin, ICompany, IMarket } from '../../../domain/savings.domain';
import { CoinService } from './coin.service';
import { PortfolioCoin } from '../model/PortfolioCoin';
import { SavingsService } from '../../../service/savings.service';
import { StockService } from './stock.service';


@Injectable({
  providedIn: 'root'
})
export class MarketStateService {
  public marketAssets$: BehaviorSubject<IMarket | null> = new BehaviorSubject<IMarket>(null);
  public portfolioAsset$: BehaviorSubject<IAsset | null> = new BehaviorSubject<IAsset | null>(null);
  public isExistingAsset: boolean = false;

  constructor(
    private coinService: CoinService,
    private savingService: SavingsService,
    private stockService: StockService,
  ) { 
  }

  public getAsset(): Observable<IMarket> {
    return this.marketAssets$.pipe(
      withLatestFrom(this.portfolioAsset$),
      switchMap(([marketAsset, portfolioAsset]) => {
        if (marketAsset === null && portfolioAsset) {
          return this.findMarketInfoByAsset(portfolioAsset);
        } else {
          return this.findMarketInfoByMarketAsset(marketAsset);
        }
      }
    ));
  }

  public selectAsset(marketAssets: IMarket): void {
    this.marketAssets$.next(marketAssets);

    const portfolioAsset = this.savingService.getPortfolioAssetBySymbol(marketAssets.symbol);

    if(portfolioAsset) {
      this.isExistingAsset = true;
      this.portfolioAsset$.next(portfolioAsset);
    }
  }

  public selectPortfolioAsset(portfolioAsset: IAsset): void {
    this.isExistingAsset = true;
    this.portfolioAsset$.next(portfolioAsset);
  }

  public destroyMarketState(): void {
    this.marketAssets$.next(null);
    this.portfolioAsset$.next(null);
    this.isExistingAsset = false;
  }

  private findMarketInfoByAsset(portfolioAssets: IAsset): Observable<IMarket> {
    if(portfolioAssets.assetType === 'Crypto') {
      return this.findCoinMarketInfoByAsset(portfolioAssets);
    } else {
      return this.findPortfolioMarketInfoByAsset(portfolioAssets);
    }
  }

  private findCoinMarketInfoByAsset(portfolioAssets: IAsset): Observable<IMarket> {
    const findedAsset = portfolioAssets as PortfolioCoin;
    return this.coinService.getCoinMarketInfoBySymbol(findedAsset.id);
  }

  private findPortfolioMarketInfoByAsset(portfolioAssets: IAsset): Observable<IMarket> {
    return this.stockService.getCompany(portfolioAssets.symbol);
  }



  private findMarketInfoByMarketAsset(marketAssets: IMarket): Observable<IMarket> {
    if(marketAssets.assetType === 'Crypto') {
      return this.findCoinMarketInfoByMarketAsset(marketAssets);
    } else {
      return this.findStockMarketInfoByMarketAsset(marketAssets);
    }
  }

  private findCoinMarketInfoByMarketAsset(marketAssets: IMarket): Observable<IMarket> {
    const marketAssetInfo = marketAssets as ICoin;
    if(marketAssetInfo) {
      return this.coinService.getCoinMarketInfoBySymbol(marketAssetInfo.id);
    }
    return of(null);
  }

  private findStockMarketInfoByMarketAsset(marketAssets: IMarket): Observable<IMarket> {
    const marketAssetInfo = marketAssets as ICompany;
    if(marketAssetInfo) {
      return this.stockService.getCompany(marketAssetInfo.symbol);
    }
    return of(null);
  }
}
