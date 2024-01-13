import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ISpending } from '../domain/spending.domain';
import moment from 'moment';
import { IMonthlySpending, ISpendingHistory, IYearSpending } from '../domain/statistic.domain';


@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private readonly localStorageKey = 'spendingData';
  public historySpending: ISpending[] = [];

  constructor() {
    const storedData = localStorage.getItem(this.localStorageKey);
    const parse: ISpending[] = JSON.parse(storedData);

    if(parse !== null) {
      this.historySpending = parse;
    }
  }

  public loadByDate(date: moment.Moment): Observable<ISpending[]> {
    const filterExpenses = this.historySpending.filter(spending => moment(spending.date).startOf('day').isSame(date.startOf('day')));
    return of(filterExpenses);
  }

  public loadByCurrentMonth():Observable<ISpending[]> {
    
    const filterExpenses = this.historySpending.filter(spending => moment(spending.date).startOf('month').isSame(moment().startOf('month')));
    
    
    return of(filterExpenses);
  }

  public loadByMonth(year: number, month: number) :ISpending[] {
    const result = this.historySpending.filter((spending) => {
      const spendingDate = new Date(spending.date);
      return spendingDate.getFullYear() === year && spendingDate.getMonth() + 1 === month
    });
    return result;
  }

  public addSpending(spending: ISpending):Observable<ISpending> {
    if(spending.title == null) {
      throw Error('cost or name of product can not be null')
    }

    if(spending.id == null) {
      spending.id = this.getLastId();
    }
    
    this.historySpending.push(spending);
    localStorage.setItem(this.localStorageKey, JSON.stringify(this.historySpending));
    return of(spending);
  }

  public generateSpendingHistory(): ISpendingHistory {
    const expenseHistory: ISpendingHistory = { years: [] };
  
    this.historySpending.forEach((spending: ISpending) => {
      const { year, month } = this.extractYearAndMonth(spending);
  
      let yearEntry = this.getOrCreateYearEntry(expenseHistory, year);
      let monthEntry = this.getOrCreateMonthEntry(yearEntry, month);
  
      monthEntry.totalAmount += spending.cost;
    });
  
    return expenseHistory;
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
    return this.historySpending.length + 1;
  }
}
