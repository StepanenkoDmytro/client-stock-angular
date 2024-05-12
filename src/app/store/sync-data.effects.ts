import { Actions, createEffect, ofType } from "@ngrx/effects";
import { ISpendingsState } from "../pages/spending/store/spendings.reducer";
import { Store } from "@ngrx/store";
import { Injectable } from "@angular/core";
import { deleteUnsavedData } from "./sync-data.actions";
import { tap, withLatestFrom } from "rxjs";
import { spendingsHistorySelector } from "../pages/spending/store/spendings.selectors";
import { deleteSpending } from "../pages/spending/store/spendings.actions";

@Injectable()
export class SyncDataEffects {

  constructor(
    private actions$: Actions,
    private store$: Store<ISpendingsState>,
  ) {}

  deleteUnsavedData$ = createEffect(() => this.actions$.pipe(
    ofType(deleteUnsavedData),
    withLatestFrom(
        this.store$.select(spendingsHistorySelector),
    ),
    tap(([action, spendings]) => {
        spendings.forEach(spending => {
            const id = spending.id;
            this.store$.dispatch(deleteSpending({id}));
        });
    })
    ), { dispatch: false });
}