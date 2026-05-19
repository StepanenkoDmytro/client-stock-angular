import { createAction } from '@ngrx/store';
import { IAccountV2 } from '../../../domain/account-v2.domain';
import { IAccountsState } from './accounts.reducer';

export const loadAccounts = createAction(
  '[ACCOUNTS] Load Accounts',
  (payload: { state: IAccountsState }) => ({ payload }),
);

export const addAccount = createAction(
  '[ACCOUNTS] Add Account',
  (payload: { account: IAccountV2 }) => ({ payload }),
);

export const editAccount = createAction(
  '[ACCOUNTS] Edit Account',
  (payload: { account: IAccountV2 }) => ({ payload }),
);

export const deleteAccount = createAction(
  '[ACCOUNTS] Delete Account',
  (payload: { id: string }) => ({ payload }),
);
