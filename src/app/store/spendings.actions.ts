import { createAction } from "@ngrx/store";
import { ISpending } from "../domain/spending.domain";
import { IUserState } from "./user.reducer";

export const addSpending = 
    createAction(
        '[SPENDING] Add Spending', 
        (payload: { spending: ISpending }) => ({ payload })
    );

export const loadSpending = 
createAction(
    '[SPENDING] Load Spendings', 
    (payload: { state: IUserState }) => ({ payload })
);
