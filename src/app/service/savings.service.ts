import { Injectable } from '@angular/core';
import { IAsset } from '../domain/savings.domain';
import { BehaviorSubject, Observable, map, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SavingsService {
  private readonly localStorageKey = 'savingsData';
  public $historySaving: BehaviorSubject<IAsset[]> = new BehaviorSubject<IAsset[]>([]);
  public historySavingsSubject: IAsset[] = [];

  constructor() {
    const storedData = localStorage.getItem(this.localStorageKey);
    const parse: IAsset[] = JSON.parse(storedData);

    if(parse !== null) {
      this.historySavingsSubject = parse;
      this.$historySaving.next(parse);
    }
  }

  public getAll(): Observable<IAsset[]> {
    return this.$historySaving;
  }

  public addSaving(newAsset: IAsset): void {
    const existAsset: IAsset = this.historySavingsSubject.find(asset => asset.symbol === newAsset.symbol);

    if(!!existAsset) {
      this.updateExistingAsset(existAsset, newAsset);
    } else {
      this.addNewAsset(newAsset);
    }

    this.updateLocalStorageAndNotify();
  }

  public deleteSaving(deleteSaving: IAsset): void {
    const indexToRemove = this.historySavingsSubject.indexOf(deleteSaving);
    this.historySavingsSubject.splice(indexToRemove, 1);
    this.updateLocalStorageAndNotify();
  }

  public getCostOfAllAssets(): Observable<number> {
    return this.$historySaving.pipe(
      map(assetsList => 
            assetsList.reduce((accumulator, currentValue) => {
                return accumulator + (currentValue.buyPrice * currentValue.count);
              }, 0)
    ));
  }

  private updateLocalStorageAndNotify(): void {
    localStorage.setItem(this.localStorageKey, JSON.stringify(this.historySavingsSubject));
    this.$historySaving.next(this.historySavingsSubject);
  }

  private updateExistingAsset(existAsset: IAsset, newAsset: IAsset): void {
    const existingCost = existAsset.buyPrice * existAsset.count;
      const addAssetCost = newAsset.price * newAsset.count;

      const sumOfCost = existingCost + addAssetCost;
      const sumOfCount = existAsset.count + newAsset.count;
      
      const avgPrice = sumOfCost / sumOfCount;

      existAsset.buyPrice = avgPrice;
      existAsset.count = sumOfCount;

      const index = this.historySavingsSubject.findIndex(asset => asset.symbol === newAsset.symbol);
      this.historySavingsSubject[index] = existAsset;
  }

  private addNewAsset(newAsset: IAsset): void {
    newAsset.buyPrice = newAsset.price;
    this.historySavingsSubject.push(newAsset);
  }
}
