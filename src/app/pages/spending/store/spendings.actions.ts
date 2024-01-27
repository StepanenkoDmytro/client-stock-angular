import { createAction } from "@ngrx/store";
import { ISpending } from "../../../domain/spending.domain";
import { ISpendingsState } from "./spendings.reducer";


export const addSpending = 
    createAction(
        '[SPENDING] Add Spending', 
        (payload: { spending: ISpending }) => ({ payload })
    );

export const editSpending = 
    createAction(
        '[SPENDING] Edit Spendings', 
        (payload: { spending: ISpending }) => ({ payload })
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
