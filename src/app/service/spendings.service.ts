import { Injectable } from '@angular/core';
import { Observable, filter, map } from 'rxjs';
import { ISpending } from '../domain/spending.domain';
import moment from 'moment';
import { Store, select } from '@ngrx/store';
import { IUserState } from '../store/user.reducer';
import { addSpending, loadSpending } from '../store/spendings.actions';
import { spendingHistorySelector, spendingsFeatureSelector } from '../store/spendings.selectors';
import { v4 as uuidv4 } from 'uuid';


@Injectable({
  providedIn: 'root'
})
export class SpendingsService {
  private readonly historyLocalStorageKey = 'spendingData';
  private isInit: boolean = false;

  constructor(
    private store$: Store<IUserState>,
  ) { }

  public loadByDate(date: moment.Moment): Observable<ISpending[]> {
    return this.getAll().pipe(
      map(spendingList => 
        spendingList.filter(spending => 
          moment(spending.date).startOf('day').isSame(date.startOf('day'))))
    );
  }

  public loadByCurrentMonth(): Observable<ISpending[]> {
    return this.getAll().pipe(
      map(spendingList => 
        spendingList.filter(spending => 
          moment(spending.date).startOf('month').isSame(moment().startOf('month'))))
    );
  }

  public addSpending(spending: ISpending): void {
    if(spending.title === null) {
      throw Error('cost or name of product can not be null')
    }

    if(spending.id === null) {
      spending.id = uuidv4();
    }

    this.store$.dispatch(addSpending({ spending }));
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

  public getAll(): Observable<ISpending[]> {
    return this.store$.pipe(select(spendingHistorySelector))
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
      localStorage.setItem(this.historyLocalStorageKey, JSON.stringify(spendingHistoryState));
    })
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
