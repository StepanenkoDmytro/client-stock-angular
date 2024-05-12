import { Injectable } from '@angular/core';
import { Observable, filter, firstValueFrom, lastValueFrom, map } from 'rxjs';
import moment from 'moment';
import { ISpendingsState } from '../pages/spending/store/spendings.reducer';
import { Store, select } from '@ngrx/store';
import { spendingsHistorySelector, spendingsFeatureSelector } from '../pages/spending/store/spendings.selectors';
import { addSpending, deleteSpending, editSpending, loadSpending } from '../pages/spending/store/spendings.actions';
import { Spending } from '../pages/spending/model/Spending';


@Injectable({
  providedIn: 'root'
})
export class SpendingsService {
  private readonly spendingHistoryLocalStorageKey = 'spendings-history';
  public isInit: boolean = false;

  constructor(
    private store$: Store<ISpendingsState>,
  ) { }

  public loadByDate(date: moment.Moment): Observable<Spending[]> {
    return this.getAll().pipe(
      map(spendingList => 
        spendingList.filter(spending => 
          moment(spending.date).startOf('day').isSame(date.startOf('day'))))
    );
  }

  public loadByCurrentMonth(): Observable<Spending[]> {
    return this.getAll().pipe(
      map(spendingList => 
        spendingList.filter(spending => 
          moment(spending.date).startOf('month').isSame(moment().startOf('month'))))
    );
  }

  public getSpentByDay(): Observable<number> {
    const currentDay = moment(new Date);
    return this.loadByDate(currentDay).pipe(
      map(spendingList => {
        if (spendingList) {
          return spendingList
            .map(spend => spend.cost)
            .reduce((accumulator, cost) => accumulator + cost, 0);
        }
        return 0; 
      })
    );
  }

  public addSpending(spending: Spending): void {
    if(spending.title === null) {
      throw Error('cost or name of product can not be null')
    }

    this.store$.dispatch(addSpending({ spending }));
  }

  public editSpending(spending: Spending): void {
    spending.isSaved = false;
    this.store$.dispatch(editSpending({ spending }));
  }

  public deleteSpending(spending: Spending): void {
    const id = spending.id;
    this.store$.dispatch(deleteSpending({id}));
  }

  public async deleteUnsavedSpendings(): Promise<void> {
    
    try {
      const allSpendings: Spending[] = await firstValueFrom(this.getAll());
      debugger;
      const unsavedSpendings: Spending[] = allSpendings.filter(spending => spending.isSaved === false);
      if (unsavedSpendings.length > 0) {
        unsavedSpendings.forEach(spending => this.deleteSpending(spending));
      } else {
        console.log('No unsaved spendings to delete.');
      }
    } catch (error) {
      console.error('Error deleting unsaved spendings:', error);
    }
  }

  public getAll(): Observable<Spending[]> {
    return this.store$.pipe(select(spendingsHistorySelector));
  }

  public init(): void {
    if(this.isInit) {
      return;
    }

    this.isInit = true;
    
    this.loadFromStorage();

    this.store$.pipe(
      select(spendingsFeatureSelector),
      filter(state => !!state)
      ).subscribe(spendingHistoryState => {

      localStorage.setItem(this.spendingHistoryLocalStorageKey, JSON.stringify(spendingHistoryState));
    });

    window.addEventListener('storage', () => this.loadFromStorage());
  }

  public loadFromStorage(): void {
    
    const storageState = localStorage.getItem(this.spendingHistoryLocalStorageKey);
    if(storageState) {
      this.store$.dispatch(loadSpending({
        state: JSON.parse(storageState)
      }))
    }
  }
}
