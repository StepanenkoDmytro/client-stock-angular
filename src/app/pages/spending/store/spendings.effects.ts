import { Injectable } from '@angular/core';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, filter, map, mergeMap, tap} from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { addSpending, deleteSpending, editSpending } from './spendings.actions';
import { AuthService } from '../../../service/auth.service';
import { Spending } from '../model/Spending';
import { ISavingsState } from '../../savings/store/asset.reducer';
import { Store } from '@ngrx/store';


@Injectable()
export class SpendingsEffects {
  private readonly url: string = 'http://localhost:8000/api/v1/profile/';

  constructor(
    private actions$: Actions,
    private http: HttpClient,
    private authService: AuthService,
    private store: Store<ISavingsState>
  ) {}

  addSpending$ = createEffect(() => this.actions$.pipe(
    ofType(addSpending, editSpending),
    filter(() => !!this.authService.authToken),
    mergeMap(action => {
      const newSpending = action.payload.spending;
      const transformedToApi = Spending.mapToSpendingApi(newSpending);

      const savedSpendingUrl = this.url + 'add-spending';

      return this.http.post(savedSpendingUrl, transformedToApi).pipe(
        tap((response: any) => {
          console.log('response from server ', response);
          const transformedFromApi = Spending.mapFromSpendingApi(response);
          this.store.dispatch(editSpending({ spending: transformedFromApi }));
        }), 
        catchError(error => of(console.log({ error }))) 
      );
    })
  ), { dispatch: false });


  deleteSpending$ = createEffect(() => this.actions$.pipe(
    ofType(deleteSpending),
    filter(() => !!this.authService.authToken),
    mergeMap(action => {
      const deleteUrl = this.url + 'delete-spending/' + action.payload.id;

      return this.http.delete(deleteUrl).pipe(
        map(() => console.log('success deleting spending')), 
        catchError(error => of(console.log({ error }))) 
      );
    })
  ), { dispatch: false });
}
