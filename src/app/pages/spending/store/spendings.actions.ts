import { createAction, props } from "@ngrx/store";
import { ISpendingsState } from "./spendings.reducer";
import { Spending } from "../model/Spending";
import { Category } from "../../../domain/category.domain";


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

export const deleteSpendingWithoutApiCall = 
    createAction(
        '[SPENDING] Delete Spendings Without api call', 
        (payload: { id: string }) => ({ payload })
    );

export const loadSpendingFailure = createAction(
    '[Spending] Load Spending Failure',
    props<{ error: any }>()
    );

export const addCategory = 
    createAction(
        '[SPENDING] Add Category', 
        (payload: { category: Category }) => ({ payload })
    );

export const loadCategories = 
    createAction(
        '[SPENDING] Load Categories', 
        (payload: { state: ISpendingsState }) => ({ payload })
    );

export const resetCategories = 
    createAction(
        '[SPENDING] Reset Categories', 
        (payload: { categorySpendings: Category[] }) => ({ payload })
    );
