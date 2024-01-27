import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, of, switchMap, withLatestFrom } from 'rxjs';
import { IAsset, IMarket } from '../../../../../domain/savings.domain';
import { CoinService } from './coin.service';
import { PortfolioCoin } from '../markets-assets/model/PortfolioCoin';

@Injectable({
  providedIn: 'root'
})
export class MarketStateService {
  public marketAssets$: BehaviorSubject<IMarket | null> = new BehaviorSubject<IMarket>(null);
  public portfolioAsset$: BehaviorSubject<IAsset | null> = new BehaviorSubject<IAsset | null>(null);
  public isExistingAsset: boolean = false;

  constructor(
    private coinService: CoinService,
  ) { }

  public getAsset(): Observable<IMarket> {
    return this.marketAssets$.pipe(
      withLatestFrom(this.portfolioAsset$),
      switchMap(([stream, portfolioAsset]) => {
        if (portfolioAsset !== null) {
          this.isExistingAsset = true;
          return this.findCoinMarketInfo(portfolioAsset);
        } else {
          return of(stream);
        }
      }
    ));
  }

  public selectAsset(marketAssets: IMarket): void {
    this.marketAssets$.next(marketAssets);
  }

  public findCoinMarketInfo(marketAssets: IAsset): Observable<IMarket> {
    const findedAsset = marketAssets as PortfolioCoin;
    return this.coinService.getCoinMarketInfoBySymbol(findedAsset.id).pipe(map(data => data.coin));
  }

  public selectPortfolioAsset(portfolioAsset: IAsset): void {
    console.log('selectPortfolioAsset');
    this.isExistingAsset = true;
    this.portfolioAsset$.next(portfolioAsset);
  }
}
