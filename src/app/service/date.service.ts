import { Injectable } from '@angular/core';
import moment from 'moment';
import { BehaviorSubject } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class DateService {

  public date: BehaviorSubject<moment.Moment> = new BehaviorSubject(moment());

  public changeMonth(dir: number) {
    const value: moment.Moment = this.date.value.add(dir, 'month');
    this.date.next(value);
  }

  public changeDate(date: moment.Moment) {
    const value: moment.Moment = this.date.value.set({
        date: date.date(),
        month: date.month()
    });
    
    this.date.next(value);
  }
}
