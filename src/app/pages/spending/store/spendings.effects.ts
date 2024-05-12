import { Injectable } from '@angular/core';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { EMPTY, Observable, of } from 'rxjs';
import { catchError, filter, map, mergeMap, switchMap, tap, withLatestFrom} from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { addMultipleSpendings, addSpending, deleteSpending, editSpending, loadSpending } from './spendings.actions';
import { AuthService } from '../../../service/auth.service';
import { Spending } from '../model/Spending';
import { ISavingsState } from '../../savings/store/asset.reducer';
import { Store } from '@ngrx/store';
import { selectPortfolioID } from '../../../store/user.selectors';
import { ISpendingsState } from './spendings.reducer';


@Injectable()
export class SpendingsEffects {
  private readonly url: string = 'http://pegazzo.online:8000/api/v1/profile/';

  constructor(
    private actions$: Actions,
    private http: HttpClient,
    private authService: AuthService,
    private store: Store<ISavingsState>,
  ) {}

  addSpending$ = createEffect(() => this.actions$.pipe(
    ofType(addSpending, editSpending),
    filter(() => !!this.authService.authToken),
    withLatestFrom(this.store.select(selectPortfolioID)),
    switchMap(([action, portfolioID]) => {
      const newSpending = action.payload.spending;
      if(!newSpending.isSaved) {
        return this.sendSpendingToServer(portfolioID, newSpending);
      } else {
        return EMPTY;
      }
    })
  ), { dispatch: false });

  loadSpendings$ = createEffect(() => this.actions$.pipe(
    ofType(loadSpending),
    filter(() => !!this.authService.authToken),
    withLatestFrom(this.store.select(selectPortfolioID)),
    switchMap(([action, portfolioID]) => {
      return this.syncSpendingListWithServer(action.payload.state, portfolioID);
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


  private sendSpendingToServer(portfolioID: number, spending: Spending): Observable<Spending> {
    const transformedToApi = Spending.mapToSpendingApi(spending);

    const savedSpendingUrl = this.url + portfolioID + '/add-spending';

    return this.http.post(savedSpendingUrl, transformedToApi).pipe(
      tap((response: any) => {
        console.log('response from server ', response);
        const transformedFromApi = Spending.mapFromSpendingApi(response);
        this.store.dispatch(editSpending({ spending: transformedFromApi }));
      }), 
      catchError(error => {
        console.error('Error occurred while saving spending:', error);
        return EMPTY;
      })
    );
  }

  private syncSpendingListWithServer(spendingState: ISpendingsState, portfolioID: number): Observable<ISpendingsState> {
    const loadSpendingsUrl = this.url + 'spendings-list/' + portfolioID;
    return this.http.get<Spending[]>(loadSpendingsUrl).pipe(
      map(serverSpendings => {
        console.log('serverSpendings', serverSpendings);
        const clientSpendings = spendingState.spendingsHistory;
        const newSpendingsFromServer = this.filterNewSpendingsFromServer(serverSpendings, clientSpendings);
        console.log('clientSpendings', clientSpendings);
        if (newSpendingsFromServer.length > 0) {
          this.store.dispatch(addMultipleSpendings({ spendings: newSpendingsFromServer }));
        }

        this.sendUnsavedSpendingsToServer(clientSpendings);
        
        return spendingState; 
      }),
      catchError(error => {
        console.error('Error occurred while loading spending:', error);
        return EMPTY;
      })
    );
  }

  private filterNewSpendingsFromServer(serverSpendings: Spending[], clientSpendings: Spending[]): Spending[] {
    return serverSpendings.filter(serverSpending => 
      !clientSpendings.some(clientSpending => serverSpending.id === clientSpending.id)
    ).map(spending => Spending.mapFromSpendingApi(spending));
  }

  private sendUnsavedSpendingsToServer(clientSpendings: Spending[]): void {
    clientSpendings
      .filter(spending => !spending.isSaved)
      .forEach(unsavedSpending => {
        console.log('unsavedSpending', unsavedSpending);
        this.store.dispatch(addSpending({ spending: unsavedSpending }));
      });
  }
}
