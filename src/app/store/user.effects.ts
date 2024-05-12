import { Injectable } from '@angular/core';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { mergeMap, tap, withLatestFrom } from 'rxjs/operators';
import { saveUser } from './user.actions';
import { Store } from '@ngrx/store';
import { loadSpending } from '../pages/spending/store/spendings.actions';
import { SpendingsService } from '../service/spendings.service';

@Injectable()
export class UserEffects {

  constructor(
    private actions$: Actions,
    private store: Store<any>,
    private spendingsService: SpendingsService
    ) {}

  userActionEffect$ = createEffect(() => this.actions$.pipe(
    ofType(saveUser),
    tap(() => this.spendingsService.isInit = false)
  ), { dispatch: false });

}
