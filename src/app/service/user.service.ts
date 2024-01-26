import { Injectable } from '@angular/core';
import { IUserState } from '../store/user.reducer';
import { Store, select } from '@ngrx/store';
import { ISpending } from '../domain/spending.domain';
import { addSpending, deleteSpending, editSpending } from '../store/spendings.actions';
import { Observable } from 'rxjs';
import { spendingHistorySelector, spendingsFeatureSelector } from '../store/spendings.selectors';
import { loadUser } from '../store/user.actions';
import { IAsset } from '../domain/savings.domain';
import { addAsset } from '../store/assets.actions';


@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly historyLocalStorageKey = 'user-state';
  private isInit: boolean = false;

  constructor(
    private store$: Store<IUserState>,
  ) { }

  //Spendings methods

  public getAllSpendings(): Observable<ISpending[]> {
    return this.store$.pipe(select(spendingHistorySelector));
  }

  public addSpending(spending: ISpending): void {
    this.store$.dispatch(addSpending({ spending }));
  }

  public editSpending(spending: ISpending): void {
    this.store$.dispatch(editSpending({ spending }));
  }

  public deleteSpending(spending: ISpending): void {
    
    const id = spending.id;
    this.store$.dispatch(deleteSpending({id}));
  }

  //Savings methods

  public addAsset(asset: IAsset): void {
    this.store$.dispatch(addAsset({asset}));
  }

  //Init user service

  public init(): void {
    if(this.isInit) {
      return;
    }

    this.isInit = true;
    this.loadFromStorage();

    this.store$.pipe(
      select(spendingsFeatureSelector),
      // filter(state => !!state)
      ).subscribe(spendingHistoryState => {
      localStorage.setItem(this.historyLocalStorageKey, JSON.stringify(spendingHistoryState));
    });

    window.addEventListener('storage', () => this.loadFromStorage());
  }

  private loadFromStorage(): void {
    const storageState = localStorage.getItem(this.historyLocalStorageKey);
    if(storageState) {
      this.store$.dispatch(loadUser({
        state: JSON.parse(storageState)
      }))
    }
  }
}
