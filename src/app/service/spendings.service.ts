import { Injectable } from '@angular/core';
import { Observable, filter, map } from 'rxjs';
import { ISpending } from '../domain/spending.domain';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import { ISpendingsState } from '../pages/spending/store/spendings.reducer';
import { Store, select } from '@ngrx/store';
import { spendingsHistorySelector, spendingsFeatureSelector } from '../pages/spending/store/spendings.selectors';
import { addSpending, deleteSpending, editSpending, loadSpending } from '../pages/spending/store/spendings.actions';


@Injectable({
  providedIn: 'root'
})
export class SpendingsService {
  private readonly spendingHistoryLocalStorageKey = 'spendings-history';
  public isInit: boolean = false;

  constructor(
    private store$: Store<ISpendingsState>,
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

    if(!spending.id) {
      spending.id = uuidv4();
    }

    this.store$.dispatch(addSpending({ spending }));
  }

  public editSpending(spending: ISpending): void {
    this.store$.dispatch(editSpending({ spending }));
  }

  public deleteSpending(spending: ISpending): void {
    const id = spending.id;
    this.store$.dispatch(deleteSpending({id}));
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

  private loadFromStorage(): void {
    
    const storageState = localStorage.getItem(this.spendingHistoryLocalStorageKey);
    if(storageState) {
      this.store$.dispatch(loadSpending({
        state: JSON.parse(storageState)
      }))
    }
  }
}
