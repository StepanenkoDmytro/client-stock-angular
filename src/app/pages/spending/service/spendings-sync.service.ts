import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, tap, catchError, EMPTY, map } from 'rxjs';
import { Category } from '../../../domain/category.domain';
import { Spending } from '../model/Spending';
import { editSpending, addMultipleSpendings, addSpending } from '../store/spendings.actions';
import { ISpendingsState } from '../store/spendings.reducer';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { OfflineStorageService } from '../../../core/offline-storage/offline-storage.service';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SpendingsSyncService {
  private readonly url: string = `${environment.apiBaseUrl}/profile/`;
  private static readonly ENTITY_KEY = 'spendings';

  constructor(
    private http: HttpClient,
    private store$: Store<ISpendingsState>,
    private offlineStorage: OfflineStorageService,
  ) { }

  // Phase 3a — `navigator.onLine` guards removed (ADR-0012 §"Виправлення
  // багів"). Calls always fire; the global ApiErrorInterceptor surfaces the
  // snackbar on network / 5xx; local catchError keeps state recoverable so
  // the next sync pass re-attempts via `sendUnsavedSpendingsToServer` (and
  // the delete drain below).

  public sendSpendingToServer(portfolioID: number, spending: Spending, categories: Category[]): Observable<Spending> {
    const transformedToApi = Spending.mapToSpendingApi(spending);

    const savedSpendingUrl = this.url + portfolioID + '/add-spending';
    return this.http.post(savedSpendingUrl, transformedToApi).pipe(
      tap((response: any) => {
        const transformedFromApi = Spending.mapFromSpendingApi(response, categories);
        this.store$.dispatch(editSpending({ spending: transformedFromApi }));
      }),
      // Failure leaves the spending in the store with `isSaved: false` —
      // the next `syncSpendingListWithServer` pass picks it up via
      // `sendUnsavedSpendingsToServer`. Interceptor already toasted.
      catchError(() => EMPTY),
    );
  }

  public syncSpendingListWithServer(spendingState: ISpendingsState, portfolioID: number, categories: Category[]): Observable<ISpendingsState> {
    // Drain queued offline deletes from previous sessions (Phase 3a:
    // delete drain activated; was commented-out scaffolding). Fire-and-
    // forget — each call re-queues itself on transient failure.
    this.drainFailedDeletes();

    const loadSpendingsUrl = this.url + 'spendings-list/' + portfolioID;
    return this.http.get<Spending[]>(loadSpendingsUrl).pipe(
      map(serverSpendings => {
        const clientSpendings = spendingState.spendingsHistory;
        const newSpendingsFromServer = this.filterNewSpendingsFromServer(serverSpendings, clientSpendings, categories);

        if (newSpendingsFromServer.length > 0) {
          this.store$.dispatch(addMultipleSpendings({ spendings: newSpendingsFromServer }));
        }

        this.sendUnsavedSpendingsToServer(clientSpendings);

        return spendingState;
      }),
      catchError(() => EMPTY),
    );
  }

  public deleteSpending(spendingId: string): Observable<void> {
    const deleteUrl = this.url + 'delete-spending/' + spendingId;

    return this.http.delete<void>(deleteUrl).pipe(
      map(() => undefined),
      catchError((error: HttpErrorResponse) => {
        // Re-queue on transient failure so the next `syncSpendingList` pass
        // drains it. 4xx (already gone / never existed) is silently OK —
        // the local record is already removed by the reducer.
        if (this.isTransient(error)) {
          this.offlineStorage.enqueueDelete(SpendingsSyncService.ENTITY_KEY, spendingId);
        }
        return EMPTY;
      }),
    );
  }

  private drainFailedDeletes(): void {
    const queue = this.offlineStorage.drainDeletes(SpendingsSyncService.ENTITY_KEY);
    for (const id of queue) {
      this.deleteSpending(id).subscribe();
    }
  }

  private isTransient(error: HttpErrorResponse): boolean {
    return error.status === 0 || error.status === 429 ||
      (error.status >= 500 && error.status < 600);
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
        this.store$.dispatch(addSpending({ spending: unsavedSpending }));
      });
  }
}
