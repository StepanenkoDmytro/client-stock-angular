import { createSelector } from "@ngrx/store";
import { userFeatureSelector } from "./user.selectors";


export const spendingHistorySelector = createSelector(userFeatureSelector,
    state => state.user.spendingsHistory)