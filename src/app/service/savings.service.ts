import { Injectable } from '@angular/core';
import { IAsset } from '../domain/savings.domain';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SavingsService {
  private readonly localStorageKey = 'savingsData';
  public historySavings: IAsset[] = [];

  constructor() {
    const storedData = localStorage.getItem(this.localStorageKey);
    const parse: IAsset[] = JSON.parse(storedData);

    if(parse !== null) {
      this.historySavings = parse;
    }
  }

  public getAll(): Observable<IAsset[]> {
    return of(this.historySavings);
  }

  public addSavings(saving: IAsset):Observable<IAsset> {
    this.historySavings.push(saving);
    localStorage.setItem(this.localStorageKey, JSON.stringify(this.historySavings));
    return of(saving);
  }
}
