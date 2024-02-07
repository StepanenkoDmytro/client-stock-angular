import { createFeatureSelector, createSelector } from "@ngrx/store";
import { IUserState } from "./user.reducer";

export const userFeatureSelector = createFeatureSelector<IUserState>('user-info');

export const selectPortfolioID = createSelector(
    userFeatureSelector,
    (state: IUserState) => state.user.portfolioID
  );
