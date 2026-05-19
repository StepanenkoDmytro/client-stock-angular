import { Injectable } from '@angular/core';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { EMPTY } from 'rxjs';
import { filter, mergeMap, switchMap, withLatestFrom } from 'rxjs/operators';
import { Category } from '../../../domain/category.domain';
import { addCategory, addSpending, deleteCategory, deleteSpending, editSpending, loadCategories, loadSpending } from './spendings.actions';
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
    private store$: Store<ISpendingsState>,
    private categoriesSyncService: CategiriesSyncService,
    private spendingsSyncService: SpendingsSyncService,
  ) {}

  /**
   * Phase 3a fix — race-safe Spending → Category. If the spending's
   * referenced category is still unsaved on the server, post the category
   * first (await), then post the spending. Otherwise the server would
   * reject the spending with "category not found".
   *
   * `mergeMap` (replaces previous `switchMap`) lets multiple add/edit
   * actions stay in flight so a rapid sequence of adds doesn't cancel
   * each other's POST.
   */
  addSpending$ = createEffect(() => this.actions$.pipe(
    ofType(addSpending, editSpending),
    filter(() => !!this.authService.authToken),
    filter(({ payload }) => !payload.spending.isSaved),
    withLatestFrom(this.store$.select(selectPortfolioID)),
    withLatestFrom(this.store$.select(categoriesSpendindSelector)),
    mergeMap(([[action, portfolioID], categories]) => {
      const newSpending = action.payload.spending;
      const category = Category.findCategoryById(newSpending.category.id, categories);

      if (!category || category.isSaved) {
        return this.spendingsSyncService.sendSpendingToServer(portfolioID, newSpending, categories);
      }

      // Chain: POST category first → only then POST spending. The
      // category sync dispatches its own `addCategory({isSaved: true})`
      // which the spending reducer picks up via the same id, so the
      // spending's `categoryId` stays valid.
      return this.categoriesSyncService.sendCategoryToServer(portfolioID, category).pipe(
        switchMap(() => this.spendingsSyncService.sendSpendingToServer(portfolioID, newSpending, categories)),
      );
    })
  ), { dispatch: false });

  loadSpendings$ = createEffect(() => this.actions$.pipe(
    ofType(loadSpending),
    filter(() => !!this.authService.authToken),
    withLatestFrom(this.store$.select(selectPortfolioID)),
    withLatestFrom(this.store$.select(categoriesSpendindSelector)),
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
    filter(({ payload }) => !payload.category.isSaved),
    withLatestFrom(this.store$.select(selectPortfolioID)),
    mergeMap(([action, portfolioID]) => {
      return this.categoriesSyncService.sendCategoryToServer(portfolioID, action.payload.category);
    })
  ), { dispatch: false });

  deleteCategory$ = createEffect(() => this.actions$.pipe(
    ofType(deleteCategory),
    filter(() => !!this.authService.authToken),
    mergeMap(action => {
      return this.categoriesSyncService.deleteCategory(action.payload.category);
    })
  ), {dispatch: false});

  loadCategories$ = createEffect(() => this.actions$.pipe(
    ofType(loadCategories),
    filter(() => !!this.authService.authToken),
    withLatestFrom(this.store$.select(selectPortfolioID)),
    switchMap(([action, portfolioID]) => {
      return this.categoriesSyncService.syncCategoriesListWithServer(action.payload.state, portfolioID);
    })
  ), { dispatch: false });
}
