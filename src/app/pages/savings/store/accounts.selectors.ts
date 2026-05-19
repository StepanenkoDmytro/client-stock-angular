import { createFeatureSelector, createSelector } from '@ngrx/store';
import { IAccountsState } from './accounts.reducer';

export const selectAccountsState =
  createFeatureSelector<IAccountsState>('accounts');

export const selectAccountsList = createSelector(
  selectAccountsState,
  (state) => state?.accountsList ?? [],
);

export const selectAccountById = (id: string) =>
  createSelector(selectAccountsList, (list) => list.find((a) => a.id === id));
