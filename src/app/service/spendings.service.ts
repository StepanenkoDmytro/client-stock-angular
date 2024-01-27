import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ISpending } from '../domain/spending.domain';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import { UserService } from './user.service';


@Injectable({
  providedIn: 'root'
})
export class SpendingsService {

  constructor(
    private userService: UserService,
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

    this.userService.addSpending(spending);
  }

  public editSpending(spending: ISpending): void {
    this.userService.editSpending(spending);
  }

  public deleteSpending(spending: ISpending): void {
    this.userService.deleteSpending(spending);
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
    return this.userService.getAllSpendings();
  }
}
