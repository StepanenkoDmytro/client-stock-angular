import { createFeatureSelector, createSelector } from "@ngrx/store";
import { ISpendingsState } from "./spendings.reducer";

export const spendingsFeatureSelector = createFeatureSelector<ISpendingsState>('spending');

export const spendingsHistorySelector = createSelector(spendingsFeatureSelector, state => state.spendingsHistory);
