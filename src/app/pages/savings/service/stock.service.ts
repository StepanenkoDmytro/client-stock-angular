import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ICompany, IMarket } from '../../../domain/savings.domain';


@Injectable({
  providedIn: 'root'
})
export class StockService {
  private readonly url: string = 'http://localhost:8000/api/v1/stocks';

  constructor(private readonly httpClient: HttpClient) { }

  public getMovers(type: string): Observable<IMarket[]> {
    const url = this.url + '/movers/' + type;
    return this.httpClient.get<IMarket[]>(url);
  }

  public getCompany(symbol: string): Observable<ICompany> {
    const url = this.url + '/' + symbol;
    return this.httpClient.get<ICompany>(url).pipe(map(company => {
      company.assetType = 'Stock';
      return company;
      }
    ));
  }
}
