import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ISpending, SPENDING_MOCK } from '../../core/domain/spending.domain';
import moment from 'moment';


@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  public historySpending: ISpending[] = SPENDING_MOCK;

  constructor() { }

  public loadByDate(date: moment.Moment): Observable<ISpending[]> {
    const filterExpenses = this.historySpending.filter(spending => moment(spending.date).startOf('day').isSame(date.startOf('day')));
 
    return of(filterExpenses);
  }

  public loadByMonth():Observable<ISpending[]> {
    const filterExpenses = this.historySpending.filter(spending => moment(spending.date).startOf('month').isSame(moment().startOf('month')));
 
    return of(filterExpenses);
  }
}
