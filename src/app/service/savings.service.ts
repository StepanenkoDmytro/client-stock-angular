import { Injectable } from '@angular/core';
import { IAsset, IPortfolioCrypto } from '../domain/savings.domain';
import { Observable, filter } from 'rxjs';
import { ISavingsState } from '../pages/savings/store/asset.reducer';
import { Store, select } from '@ngrx/store';
import { assetsListFeatureSelector, assetsListHistorySelector } from '../pages/savings/store/asset.selectors';
import { addAsset, loadSavings, editAsset, deleteAsset } from '../pages/savings/store/assets.actions';


@Injectable({
  providedIn: 'root'
})
export class SavingsService {
  private readonly assetListLocalStorageKey = 'assets-list';
  public isInit: boolean = false;
  private assetsList: IAsset[] = [];

  constructor(
    private store$: Store<ISavingsState>,
  ) { }

  public getAll(): Observable<IAsset[]> {
    return this.store$.pipe(select(assetsListHistorySelector));
  }

  public getPortfolioAssetBySymbol(assetSymbol: string): IPortfolioCrypto {
    const asset = this.assetsList.find(asset => asset.symbol === assetSymbol);
  
    if (asset && typeof asset === 'object') {
      return asset as IPortfolioCrypto;
    } else {
      return null;
    }
  }

  public addSaving(newAsset: IAsset): void {
    if(!newAsset.name) {
      throw Error('asset name can not be null')
    }
    
    newAsset.buyPrice = newAsset.price;
    this.store$.dispatch(addAsset({ asset: newAsset}));
  }

  public editAsset(editedAsset: IAsset): void {
    this.store$.dispatch(editAsset({asset: editedAsset}));
  }

  public deleteSaving(deletedAsset: IAsset): void {
    const symbol = deletedAsset.symbol;
    this.store$.dispatch(deleteAsset({symbol: symbol}));
  }

  public init(): void {
    if(this.isInit) {
      return;
    }

    this.isInit = true;
    this.loadFromStorage();

    this.store$.pipe(
      select(assetsListFeatureSelector),
      filter(state => !!state)
      ).subscribe(assetsListState => {
      localStorage.setItem(this.assetListLocalStorageKey, JSON.stringify(assetsListState));
    });

    window.addEventListener('storage', () => this.loadFromStorage());
  }

  private loadFromStorage(): void {
    const storageState = localStorage.getItem(this.assetListLocalStorageKey);
    if(storageState) {
      this.store$.dispatch(loadSavings({
        state: JSON.parse(storageState)
      }))
    }
  }
}
