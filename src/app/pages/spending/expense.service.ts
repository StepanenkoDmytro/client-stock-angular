import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ISpending } from '../../core/domain/spending.domain';
import moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  public historySpending: ISpending[] = [
    {
      id: 1,
      icon: 'assets/expend/pet.svg',
      title: 'Pet',
      cost: 10,
      date: moment().toDate(),
    },
    {
      id: 2,
      icon: 'assets/expend/clothes.svg',
      title: 'T-shirt',
      cost: 50,
      date: moment().toDate(),
    },
    {
      id: 3,
      icon: 'assets/expend/pet.svg',
      title: 'Pet',
      cost: 10,
      date: moment().subtract(6, 'days').toDate(),
    },
    {
      id: 4,
      icon: 'assets/expend/clothes.svg',
      title: 'T-shirt',
      cost: 50,
      date: moment().subtract(5, 'days').toDate(),
    },
    {
      id: 5,
      icon: 'assets/expend/pet.svg',
      title: 'Pet',
      cost: 10,
      date: moment().subtract(1, 'month').toDate(),
    },
  ];

  constructor() { }

  public loadByDate(date: moment.Moment): Observable<ISpending[]> {
    const filterExpenses = this.historySpending.filter(spending => moment(spending.date).startOf('day').isSame(date.startOf('day')));
 
    return of(filterExpenses);
  }
}
