import { Injectable } from '@angular/core';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, filter, map, mergeMap} from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { addSpending, deleteSpending, editSpending } from './spendings.actions';
import { AuthService } from '../../../service/auth.service';


@Injectable()
export class SpendingsEffects {

  constructor(
    private actions$: Actions,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  addSpending$ = createEffect(() => this.actions$.pipe(
    ofType(addSpending, editSpending),
    filter(() => !!this.authService.authToken),
    mergeMap(action => {
      const newSpending = action.payload.spending;
      const transformed = {
        id: newSpending.id,
        category: newSpending.category.title,
        title: newSpending.title,
        cost: newSpending.cost,
        date: newSpending.date,
      };

      return this.http.post('http://localhost:8000/api/v1/profile/add-spending', transformed).pipe(
        map(() => console.log('success saving spending')), 
        catchError(error => of(console.log({ error }))) 
      );
    })
  ), { dispatch: false });


  deleteSpending$ = createEffect(() => this.actions$.pipe(
    ofType(deleteSpending),
    filter(() => !!this.authService.authToken),
    mergeMap(action => {
      const deleteUrl = 'http://localhost:8000/api/v1/profile/delete-spending/' + action.payload.id;

      return this.http.delete(deleteUrl).pipe(
        map(() => console.log('success deleting spending')), 
        catchError(error => of(console.log({ error }))) 
      );
    })
  ), { dispatch: false });
}
