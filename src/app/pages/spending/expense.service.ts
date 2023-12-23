import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ISpending, SPENDING_MOCK } from '../../core/domain/spending.domain';
import moment from 'moment';


@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private readonly localStorageKey = 'spendingData';
  public historySpending: ISpending[];

  constructor() {
    const storedData = localStorage.getItem(this.localStorageKey);
    const parse: ISpending[] = JSON.parse(storedData);

    this.historySpending = parse;
  }

  public loadByDate(date: moment.Moment): Observable<ISpending[]> {
    const storedData = localStorage.getItem(this.localStorageKey);
    const parse: ISpending[] = JSON.parse(storedData);
    const filterExpenses = parse.filter(spending => moment(spending.date).startOf('day').isSame(date.startOf('day')));
    console.log(storedData);
    return of(filterExpenses);
  }

  public loadByMonth():Observable<ISpending[]> {
    
    const filterExpenses = this.historySpending.filter(spending => moment(spending.date).startOf('month').isSame(moment().startOf('month')));
    
    
    return of(filterExpenses);
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

  private getLastId(): number {
    return this.historySpending.length + 1;
  }
}
