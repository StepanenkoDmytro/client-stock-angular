import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ISpending, ISpendingHistory } from '../domain/spending.domain';
import moment from 'moment';


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
    console.log(result);
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
  
    // Пройдіться по кожному об'єкту витрат в масиві
    this.historySpending.forEach((spending: ISpending) => {
      const spendingDate = new Date(spending.date);
      const year = spendingDate.getFullYear();
      const month = spendingDate.getMonth() + 1; // Додаємо 1, оскільки getMonth повертає місяці від 0 до 11
  
      // Перевірте, чи існує рік в ExpenseHistory
      let yearEntry = expenseHistory.years.find((entry) => entry.year === year);
  
      // Якщо рік не існує, створюємо новий об'єкт ExpenseYear
      if (!yearEntry) {
        yearEntry = { year, monthlyExpenses: [] };
        expenseHistory.years.push(yearEntry);
      }
  
      // Перевірте, чи існує місяць в ExpenseYear
      let monthEntry = yearEntry.monthlyExpenses.find((entry) => entry.month === month);
  
      // Якщо місяць не існує, створюємо новий об'єкт MonthlyExpense
      if (!monthEntry) {
        monthEntry = { month, totalAmount: 0 };
        yearEntry.monthlyExpenses.push(monthEntry);
      }
      // Додаємо витрати до загальної суми місяця
      monthEntry.totalAmount += spending.cost;
    });
  
    return expenseHistory;
  }

  private getLastId(): number {
    return this.historySpending.length + 1;
  }
}
