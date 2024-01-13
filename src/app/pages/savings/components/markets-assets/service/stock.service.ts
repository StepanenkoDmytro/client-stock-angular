import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ICompany } from '../../../../../domain/savings.domain';

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private readonly url: string = 'http://45.77.60.247:8000/api/v1/stocks';

  constructor(private readonly httpClient: HttpClient) { }

  public getMovers(type: string): Observable<any> {
    const url = this.url + '/movers/' + type;
    return this.httpClient.get(url);
  }

  public getCompany(symbol: string): Observable<ICompany> {
    const url = this.url + '/' + symbol;
    return this.httpClient.get<ICompany>(url);
  }
}
