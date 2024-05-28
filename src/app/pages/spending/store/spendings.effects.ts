import { Injectable } from '@angular/core';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { EMPTY } from 'rxjs';
import { filter, mergeMap, switchMap, withLatestFrom} from 'rxjs/operators';
import { addCategory, addSpending, deleteSpending, editSpending, loadCategories, loadSpending } from './spendings.actions';
import { AuthService } from '../../../service/auth.service';
import { Store } from '@ngrx/store';
import { selectPortfolioID } from '../../../store/user.selectors';
import { categoriesSpendindSelector } from './spendings.selectors';
import { CategiriesSyncService } from '../service/categiries-sync.service';
import { SpendingsSyncService } from '../service/spendings-sync.service';
import { ISpendingsState } from './spendings.reducer';


@Injectable()
export class SpendingsEffects {

  constructor(
    private actions$: Actions,
    private authService: AuthService,
    private store: Store<ISpendingsState>,
    private categoriesSyncService: CategiriesSyncService,
    private spendingsSyncService: SpendingsSyncService
  ) {}

  addSpending$ = createEffect(() => this.actions$.pipe(
    ofType(addSpending, editSpending),
    filter(() => !!this.authService.authToken),
    withLatestFrom(this.store.select(selectPortfolioID)),
    withLatestFrom(this.store.select(categoriesSpendindSelector)),
    switchMap(([[action, portfolioID], categories]) => {
      const newSpending = action.payload.spending;
      if(!newSpending.isSaved) {
        return this.spendingsSyncService.sendSpendingToServer(portfolioID, newSpending, categories);
      } 

      return EMPTY;
    })
  ), { dispatch: false });

  loadSpendings$ = createEffect(() => this.actions$.pipe(
    ofType(loadSpending),
    filter(() => !!this.authService.authToken),
    withLatestFrom(this.store.select(selectPortfolioID)),
    withLatestFrom(this.store.select(categoriesSpendindSelector)),
    switchMap(([[action, portfolioID], categories]) => {
      return this.spendingsSyncService.syncSpendingListWithServer(action.payload.state, portfolioID, categories);
    })
  ), { dispatch: false });

  deleteSpending$ = createEffect(() => this.actions$.pipe(
    ofType(deleteSpending),
    filter(() => !!this.authService.authToken),
    mergeMap(action => {
      return this.spendingsSyncService.deleteSpending(action.payload.id);
    })
  ), { dispatch: false });

  addCategory$ = createEffect(() => this.actions$.pipe(
    ofType(addCategory),
    filter(() => !!this.authService.authToken),
    withLatestFrom(this.store.select(selectPortfolioID)),
    switchMap(([action, portfolioID]) => {
      const newCategory = action.payload.category;
      if(!newCategory.isSaved) {
        return this.categoriesSyncService.sendCategoryToServer(portfolioID, newCategory);
      } 
      
      return EMPTY;
    })
  ), { dispatch: false });

  loadCategories$ = createEffect(() => this.actions$.pipe(
    ofType(loadCategories),
    filter(() => !!this.authService.authToken),
    withLatestFrom(this.store.select(selectPortfolioID)),
    switchMap(([action, portfolioID]) => {
      return this.categoriesSyncService.syncCategoriesListWithServer(action.payload.state, portfolioID);
    })
  ), { dispatch: false });
}
