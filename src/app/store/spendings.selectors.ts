import { createFeatureSelector, createSelector } from "@ngrx/store";
import { IUserState } from "./user.reducer";

export const spendingsFeatureSelector = createFeatureSelector<IUserState>('user');

export const spendingHistorySelector = createSelector(spendingsFeatureSelector,
    state => state.user.spendingsHistory)