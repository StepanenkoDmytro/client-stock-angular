import { createAction, props } from "@ngrx/store";
import { ISpendingsState } from "./spendings.reducer";
import { Spending } from "../model/Spending";


export const addSpending = 
    createAction(
        '[SPENDING] Add Spending', 
        (payload: { spending: Spending }) => ({ payload })
    );

export const editSpending = 
    createAction(
        '[SPENDING] Edit Spendings', 
        (payload: { spending: Spending }) => ({ payload })
    );

export const addMultipleSpendings = 
    createAction(
        '[SPENDING] Add Multiple Spendings', 
        (payload: { spendings: Spending[] }) => ({ payload })
    );


export const loadSpending = 
    createAction(
        '[SPENDING] Load Spendings', 
        (payload: { state: ISpendingsState }) => ({ payload })
    );

export const deleteSpending = 
    createAction(
        '[SPENDING] Delete Spendings', 
        (payload: { id: string }) => ({ payload })
    );

export const loadSpendingFailure = createAction(
    '[Spending] Load Spending Failure',
    props<{ error: any }>()
    );
