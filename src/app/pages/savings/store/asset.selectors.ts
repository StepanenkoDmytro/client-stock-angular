import { createFeatureSelector, createSelector } from "@ngrx/store";
import { ISavingsState } from "./asset.reducer";


export const savingsFeatureSelector = createFeatureSelector<ISavingsState>('spendings-history');

export const spendingHistorySelector = createSelector(savingsFeatureSelector,
    state => state.assetsList)
    