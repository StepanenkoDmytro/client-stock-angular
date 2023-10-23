import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap, map } from 'rxjs';
import { IBudgetExpense } from '../domain/widget.domain';


interface CreateResponse {
  name: string
}

interface FirebaseRequest {
  category: string,
  cost: number,
  note: string,
}

interface FirebaseMapResponse {
  [key: string]: FirebaseRequest;
}


@Injectable({
  providedIn: 'root'
})
export class ExpendBudgetService {
  static url = 'https://widget-state-default-rtdb.firebaseio.com/expend-budget';

  constructor(private http: HttpClient) { }

  public create(form: IBudgetExpense): Observable<any> {
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

  public load(date: moment.Moment): Observable<IBudgetExpense[]> {
    const dateString = date.format('YYYY-MM-DD');
    return this.http
      .get<FirebaseMapResponse>(`${ExpendBudgetService.url}/${dateString}.json`)
      .pipe(
        tap(res => console.log(res)),
        map(tasks => {
          if (!tasks) {
            return [];
          }
          return Object.keys(tasks).map(key => ({ ...tasks[key], id: key, date: dateString }));
        })
      )
  }
}
