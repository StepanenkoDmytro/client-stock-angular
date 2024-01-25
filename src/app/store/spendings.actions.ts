import { createAction } from "@ngrx/store";
import { ISpending } from "../domain/spending.domain";

export const addSpending = 
    createAction(
        '[USER] Add Spending', 
        (payload: { spending: ISpending }) => ({ payload })
    );
