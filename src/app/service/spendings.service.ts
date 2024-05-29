import { Injectable } from '@angular/core';
import { Observable, concatMap, filter, from, map, of } from 'rxjs';
import moment from 'moment';
import { ISpendingsState } from '../pages/spending/store/spendings.reducer';
import { Store, select } from '@ngrx/store';
import { spendingsHistorySelector, spendingsFeatureSelector, categoriesSpendindSelector } from '../pages/spending/store/spendings.selectors';
import { addCategory, addSpending, deleteSpending, editSpending, loadCategories, loadSpending } from '../pages/spending/store/spendings.actions';
import { Spending } from '../pages/spending/model/Spending';
import { Category } from '../domain/category.domain';


@Injectable({
  providedIn: 'root'
})
export class SpendingsService {
  private readonly spendingHistoryLocalStorageKey = 'spendings-history';
  public isInit: boolean = false;

  constructor(
    private store$: Store<ISpendingsState>,
  ) { }

  /* Spendings */
  public loadByDate(date: moment.Moment): Observable<Spending[]> {
    return this.getAllSpendings().pipe(
      map(spendingList => 
        spendingList.filter(spending => 
          moment(spending.date).startOf('day').isSame(date.startOf('day'))))
    );
  }

  public loadByCurrentMonth(): Observable<Spending[]> {
    return this.getAllSpendings().pipe(
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
    if(spending.comment === null) {
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

  public getAllSpendings(): Observable<Spending[]> {
    return this.store$.pipe(select(spendingsHistorySelector));
  }

  /* Categories */

  public addCategory(category: Category): void {
    if(category.title === null) {
      throw Error('title of category can not be null')
    }
    
    this.store$.dispatch(addCategory({ category }));
  }

  public getAllCategories(): Observable<Category[]> {
    return this.store$.pipe(select(categoriesSpendindSelector));
  }

  public getSpendingsByRange(start: moment.Moment, end: moment.Moment): Observable<Spending[]> {
    return this.getAllSpendings().pipe(
      map(spendings => spendings.filter(spending => {
        const spendingDate = moment(spending.date);
        return spendingDate.isBetween(start, end, 'day', '[]');
      }))
    );
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

    if (storageState) {
      from([
        loadCategories({ state: JSON.parse(storageState) }),
        loadSpending({ state: JSON.parse(storageState) }),
      ]).pipe(
        concatMap(action => of(this.store$.dispatch(action)))
      ).subscribe();
    }
  }
}
