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

  public addSavings(saving: IAsset): Observable<IAsset> {
    const existAsset = this.historySavings.find(asset => asset.symbol === saving.symbol);

    if(!!existAsset) {
      const existingCost = existAsset.buyPrice * existAsset.count;
      const addAssetCost = saving.price * saving.count;

      const sumOfCost = existingCost + addAssetCost;
      const sumOfCount = existAsset.count + saving.count;
      
      const avgPrice = sumOfCost / sumOfCount;

      existAsset.buyPrice = avgPrice;
      existAsset.count = sumOfCount;

      const index = this.historySavings.findIndex(asset => asset.symbol === saving.symbol);
      this.historySavings[index] =existAsset;
      localStorage.setItem(this.localStorageKey, JSON.stringify(this.historySavings));
      return of(existAsset);
    } else {
      saving.buyPrice = saving.price;
      this.historySavings.push(saving);
      localStorage.setItem(this.localStorageKey, JSON.stringify(this.historySavings));
      return of(saving);
    }
  }

  public getCostOfAllAssets(): Observable<number> {
    const costOfAllAssets = this.historySavings.reduce((accumulator, currentValue) => {
      return accumulator + (currentValue.buyPrice * currentValue.count);
    }, 0);

    return of(costOfAllAssets);
  }
}
