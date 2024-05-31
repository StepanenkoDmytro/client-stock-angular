import { Injectable } from '@angular/core';
import { Observable, tap, catchError, EMPTY, map, of } from 'rxjs';
import { Category } from '../../../domain/category.domain';
import { Spending } from '../model/Spending';
import { editSpending, addMultipleSpendings, addSpending } from '../store/spendings.actions';
import { ISpendingsState } from '../store/spendings.reducer';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';

@Injectable({
  providedIn: 'root'
})
export class SpendingsSyncService {
  private readonly url: string = 'http://localhost:8000/api/v1/profile/';

  constructor(
    private http: HttpClient,
    private store: Store<ISpendingsState>,
  ) { }

  public sendSpendingToServer(portfolioID: number, spending: Spending, categories: Category[]): Observable<Spending> {
    const transformedToApi = Spending.mapToSpendingApi(spending);

    const savedSpendingUrl = this.url + portfolioID + '/add-spending';
    return this.http.post(savedSpendingUrl, transformedToApi).pipe(
      tap((response: any) => {
        const transformedFromApi = Spending.mapFromSpendingApi(response, categories);
        this.store.dispatch(editSpending({ spending: transformedFromApi }));
      }), 
      catchError(error => {
        console.error('Error occurred while saving spending:', error);
        return EMPTY;
      })
    );
  }

  public syncSpendingListWithServer(spendingState: ISpendingsState, portfolioID: number, categories: Category[]): Observable<ISpendingsState> {
    const loadSpendingsUrl = this.url + 'spendings-list/' + portfolioID;
    return this.http.get<Spending[]>(loadSpendingsUrl).pipe(
      map(serverSpendings => {
        const clientSpendings = spendingState.spendingsHistory;
        const newSpendingsFromServer = this.filterNewSpendingsFromServer(serverSpendings, clientSpendings, categories);
        
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

  public deleteSpending(spendingId: string): Observable<void> {
    const deleteUrl = this.url + 'delete-spending/' + spendingId;

    return this.http.delete(deleteUrl).pipe(
      map(() => console.log('success deleting spending')), 
      catchError(error => of(console.log({ error }))) 
    );
  }

  private filterNewSpendingsFromServer(serverSpendings: Spending[], clientSpendings: Spending[], categories: Category[]): Spending[] {
    return serverSpendings.filter(serverSpending => 
      !clientSpendings.some(clientSpending => serverSpending.id === clientSpending.id)
    ).map(spending => Spending.mapFromSpendingApi(spending, categories));
  }

  private sendUnsavedSpendingsToServer(clientSpendings: Spending[]): void {
    clientSpendings
      .filter(spending => !spending.isSaved)
      .forEach(unsavedSpending => {
        this.store.dispatch(addSpending({ spending: unsavedSpending }));
      });
  }
}
