import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CoinService {

  constructor(private readonly httpClient: HttpClient) { }

  public test(): Observable<any> {
    const url = 'http://localhost:8000/api/v1/coins';
    return this.httpClient.get(url);
  }
}
