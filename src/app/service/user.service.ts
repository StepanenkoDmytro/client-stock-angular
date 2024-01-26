import { Injectable } from '@angular/core';
import { IUserState } from '../store/user.reducer';
import { Store, select } from '@ngrx/store';
import { ISpending } from '../domain/spending.domain';
import { addSpending, deleteSpending, editSpending, loadSpending } from '../store/spendings.actions';
import { Observable } from 'rxjs';
import { spendingHistorySelector, spendingsFeatureSelector } from '../store/spendings.selectors';


@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly historyLocalStorageKey = 'user-state';
  private isInit: boolean = false;

  constructor(
    private store$: Store<IUserState>,
  ) { }

  public getAllSpendings(): Observable<ISpending[]> {
    return this.store$.pipe(select(spendingHistorySelector));
  }

  public addSpending(spending: ISpending): void {
    this.store$.dispatch(addSpending({ spending }));
  }

  public editSpending(spending: ISpending): void {
    console.log('editrSpending', spending)
    this.store$.dispatch(editSpending({ spending }));
  }

  public deleteSpending(spending: ISpending): void {
    
    const id = spending.id;
    this.store$.dispatch(deleteSpending({id}));
  }

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
      this.store$.dispatch(loadSpending({
        state: JSON.parse(storageState)
      }))
    }
  }
}
