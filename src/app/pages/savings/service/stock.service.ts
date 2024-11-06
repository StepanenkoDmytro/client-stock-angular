import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ICompany, ICompanyList, IMarket } from '../../../domain/savings.domain';


@Injectable({
  providedIn: 'root'
})
export class StockService {
  private readonly url: string = 'https://pegazzo.online/money-life-cycle/api/v1/markets/stocks';

  constructor(private readonly httpClient: HttpClient) { }

  public getCompaniesList(page: number): Observable<ICompanyList> {
    return this.httpClient.get<ICompanyList>(this.url);
  }

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
