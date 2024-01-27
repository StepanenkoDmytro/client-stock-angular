import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, of, switchMap, withLatestFrom } from 'rxjs';
import { IAsset, ICoin, IMarket } from '../../../../../domain/savings.domain';
import { CoinService } from './coin.service';
import { PortfolioCoin } from '../markets-assets/model/PortfolioCoin';
import { SavingsService } from '../../../../../service/savings.service';

@Injectable({
  providedIn: 'root'
})
export class MarketStateService {
  public marketAssets$: BehaviorSubject<IMarket | null> = new BehaviorSubject<IMarket>(null);
  public portfolioAsset$: BehaviorSubject<IAsset | null> = new BehaviorSubject<IAsset | null>(null);
  public isExistingAsset: boolean = false;

  constructor(
    private coinService: CoinService,
    private savingService: SavingsService
  ) { 
  }

  public getAsset(): Observable<IMarket> {
    return this.marketAssets$.pipe(
      withLatestFrom(this.portfolioAsset$),
      switchMap(([marketAsset, portfolioAsset]) => {
        if (marketAsset === null && portfolioAsset) {
          return this.findCoinMarketInfoByAsset(portfolioAsset);
        } else {
          return this.findCoinMarketInfoByMarketAsset(marketAsset);
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

  public findCoinMarketInfoByAsset(portfolioAssets: IAsset): Observable<IMarket> {
    const findedAsset = portfolioAssets as PortfolioCoin;
    return this.coinService.getCoinMarketInfoBySymbol(findedAsset.id).pipe(map(data => data.coin));
  }

  public findCoinMarketInfoByMarketAsset(marketAssets: IMarket): Observable<IMarket> {
    const marketAssetInfo = marketAssets as ICoin;
    if(marketAssetInfo) {
      return this.coinService.getCoinMarketInfoBySymbol(marketAssetInfo.id).pipe(map(data => data.coin));
    }
    return of(null);
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
}
