import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private readonly url: string = 'http://localhost:8000/api/v1/stocks';

  constructor(private readonly httpClient: HttpClient) { }

  public getMovers(type: string): Observable<any> {
    const url = this.url + '/movers/' + type;
    return this.httpClient.get(url);
  }
}
