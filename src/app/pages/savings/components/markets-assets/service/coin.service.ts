import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CoinService {
  private readonly url: string = 'http://45.77.60.247:8000/api/v1/coins';

  constructor(private readonly httpClient: HttpClient) { }

  public getCoinList(filter: string = ''): Observable<any> {
    const params = new HttpParams().set('filter', filter);
    return this.httpClient.get(this.url, {params});
  } 
}
