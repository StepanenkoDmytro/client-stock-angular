import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { MarketCoinInfo } from '../model/MarketCoinInfo';


interface IMarketCoinData {
  currentPage: number,
  data: MarketCoinInfo[],
  totalItems: number,
  totalPages: number
}

@Injectable({
  providedIn: 'root'
})
export class CoinService {
  private readonly url: string = 'https://pegazzo.online/money-life-cycle/api/v1/markets/coins';

  constructor(private readonly httpClient: HttpClient) { }

  public getCoinList(filter: string = ''): Observable<IMarketCoinData> {
    const params = new HttpParams().set('filter', filter);
    return this.httpClient.get<IMarketCoinData>(this.url, {params});
  } 

  public getCoinMarketInfoBySymbol(symbol: string): Observable<any> {
    const newUrl = this.url + '/' + symbol;
    return this.httpClient.get(newUrl);
  }
}
