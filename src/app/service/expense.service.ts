import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, of, reduce } from 'rxjs';
import { ISpending } from '../domain/spending.domain';
import moment from 'moment';
import { IMonthlySpending, ISpendingHistory, IYearSpending } from '../domain/statistic.domain';
import { Store, select } from '@ngrx/store';
import { IUserState } from '../store/user.reducer';
import { addSpending } from '../store/spendings.actions';
import { spendingHistorySelector } from '../store/spendings.selectors';


@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private readonly historyLocalStorageKey = 'spendingData';
  private readonly budgetLocalStorageKey = 'spending_budget';

  public historySpendingSubject: ISpending[] = [];

  public $monthlyBudget: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  public $historySpending: BehaviorSubject<ISpending[]> = new BehaviorSubject<ISpending[]>([]);

  // private readonly store: Store = inject(Store);
  constructor(
    private store: Store<IUserState>
  ) {
    const historyStoredData = localStorage.getItem(this.historyLocalStorageKey);
    const parseHistory: ISpending[] = JSON.parse(historyStoredData);

    if(parseHistory !== null) {
      this.historySpendingSubject = parseHistory;
      this.$historySpending.next(parseHistory);
    }
  }

  public getMonthlyBudget(): Observable<number> {
    const budgetStoredData = localStorage.getItem(this.budgetLocalStorageKey);
    const parseBudget: number = JSON.parse(budgetStoredData);

    if(parseBudget !== null) {
      this.$monthlyBudget.next(parseBudget);
    }

    return this.$monthlyBudget;
  }

  public saveMonthlyBudget(budget: number): void {
    localStorage.setItem(this.budgetLocalStorageKey, JSON.stringify(budget));
    this.$monthlyBudget.next(budget);
  }

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

  public loadByMonth(year: number, month: number) :ISpending[] {
    const result = this.historySpendingSubject.filter((spending) => {
      const spendingDate = new Date(spending.date);
      return spendingDate.getFullYear() === year && spendingDate.getMonth() + 1 === month
    });
    return result;
  }

  public addSpending(spending: ISpending): void {
    if(spending.title == null) {
      throw Error('cost or name of product can not be null')
    }

    if(spending.id == null) {
      spending.id = this.getLastId();
    }

    this.historySpendingSubject.push(spending);
    this.$historySpending.next(this.historySpendingSubject);
    localStorage.setItem(this.historyLocalStorageKey, JSON.stringify(this.historySpendingSubject));
    this.store.dispatch(addSpending({ spending }));

  }

  public getSpentByMonth(): Observable<number> {

    return this.loadByCurrentMonth().pipe(
      map(spendingList => 
        spendingList
          .map(spend => spend.cost)
          .reduce((accumulator, cost) => accumulator + cost), 0)
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
  

  public generateSpendingHistory(): ISpendingHistory {
    const expenseHistory: ISpendingHistory = { years: [] };

    this.historySpendingSubject.forEach((spending: ISpending) => {
      const { year, month } = this.extractYearAndMonth(spending);

      let yearEntry = this.getOrCreateYearEntry(expenseHistory, year);
      let monthEntry = this.getOrCreateMonthEntry(yearEntry, month);

      monthEntry.totalAmount += spending.cost;
    });
    return expenseHistory;
  }

  private getAll(): Observable<ISpending[]> {
    return this.store.pipe(select(spendingHistorySelector))
  }

  public getReduxSpendings(): Observable<ISpending[]> {
    return this.store.pipe(select(spendingHistorySelector));
  }

  private extractYearAndMonth(spending: ISpending): { year: number; month: number } {
    const spendingDate = new Date(spending.date);
    return { year: spendingDate.getFullYear(), month: spendingDate.getMonth() + 1 };
  }

  private getOrCreateYearEntry(expenseHistory: ISpendingHistory, year: number): IYearSpending {
    let yearEntry = expenseHistory.years.find((entry) => entry.year === year);

    if (!yearEntry) {
      yearEntry = { year, monthlyExpenses: [] };
      expenseHistory.years.push(yearEntry);
    }

    return yearEntry;
  }

  private getOrCreateMonthEntry(yearEntry: IYearSpending, month: number): IMonthlySpending {
    let monthEntry = yearEntry.monthlyExpenses.find((entry) => entry.month === month);

    if (!monthEntry) {
      monthEntry = { month, totalAmount: 0 };
      yearEntry.monthlyExpenses.push(monthEntry);
    }

    return monthEntry;
  }


  private getLastId(): number {
    return this.historySpendingSubject.length + 1;
  }
}
