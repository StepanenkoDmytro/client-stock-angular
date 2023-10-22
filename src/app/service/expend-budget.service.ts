import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap, map } from 'rxjs';
import { IBudgetExpense } from '../domain/widget.domain';


interface CreateResponse {
  name: string
}


@Injectable({
  providedIn: 'root'
})
export class ExpendBudgetService {
  static url = 'https://widget-state-default-rtdb.firebaseio.com/expend-budget';

  constructor(private http: HttpClient) { }

  public create(form: IBudgetExpense): Observable<any> {
    console.log(form);
    const { id, date, ...data } = form;
    
    return this.http
      .post(`${ExpendBudgetService.url}/${form.date}.json`, data)
      .pipe(
        tap(res => console.log(res)),
        map(res => {
          return res;
        })
      );
  }

  public load(date: moment.Moment): Observable<any> {
    return this.http
      .get(`${ExpendBudgetService.url}/${date.format('YYYY-MM-DD')}.json`)
      .pipe(
        tap(res => console.log(res)),
        map(tasks => {
            return tasks;
        })
      )
  }
}
