import { Injectable } from '@angular/core';
import { IAsset } from '../domain/savings.domain';
import { BehaviorSubject, Observable, map, of, tap } from 'rxjs';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class SavingsService {
  private assetsList: IAsset[] = [];

  constructor(
    private userService: UserService,
  ) { }

  public getAll(): Observable<IAsset[]> {
    return this.userService.getAllSavings().pipe(tap(assets => this.assetsList = assets));
  }

  public getPortfolioAssetBySymbol(assetSymbol: string): IAsset {
    return this.assetsList.find(asset => asset.symbol = assetSymbol);
  }

  public addSaving(newAsset: IAsset): void {

    if(!newAsset.name) {
      throw Error('asset name can not be null')
    }
    
    newAsset.buyPrice = newAsset.price;
    this.userService.addAsset(newAsset);
  }

  public editAsset(editAsset: IAsset): void {

    this.userService.editAsset(editAsset);
  }

  public deleteSaving(deleteSaving: IAsset): void {
    this.userService.deleteAsset(deleteSaving);
  }

  // public getCostOfAllAssets(): Observable<number> {
  //   return this.$historySaving.pipe(
  //     map(assetsList => 
  //           assetsList.reduce((accumulator, currentValue) => {
  //               return accumulator + (currentValue.buyPrice * currentValue.count);
  //             }, 0)
  //   ));
  // }
}
