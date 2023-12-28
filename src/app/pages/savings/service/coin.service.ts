import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CoinService {
  private readonly url: string = 'http://localhost:8000/api/v1/coins';

  constructor(private readonly httpClient: HttpClient) { }

  public getCoins(): Observable<any> {
    return this.httpClient.get(this.url);
  }
}
