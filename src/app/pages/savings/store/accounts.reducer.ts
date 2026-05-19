import { createReducer, on } from '@ngrx/store';
import { IAccountV2 } from '../../../domain/account-v2.domain';
import { logout } from '../../../store/user.actions';
import {
  addAccount,
  deleteAccount,
  editAccount,
  loadAccounts,
  markAccountSync,
} from './accounts.actions';

export interface IAccountsState {
  accountsList: IAccountV2[];
}

const initialAccountsState: IAccountsState = {
  accountsList: [],
};

/**
 * Accounts reducer. Source of truth is the backend (`/api/v1/accounts`);
 * {@link AccountsService} pulls into the store on init and replays REST
 * responses through these actions. Logout wipes the slice so a second
 * user on the same browser doesn't see the previous user's accounts.
 */
export const accountsReducer = createReducer<IAccountsState>(
  initialAccountsState,

  on(loadAccounts, (_state, action) => ({ ...action.payload.state })),

  on(addAccount, (state, action) => {
    const list = Array.isArray(state.accountsList) ? state.accountsList : [];
    return { ...state, accountsList: [...list, action.payload.account] };
  }),

  on(editAccount, (state, action) => {
    const updated = action.payload.account;
    return {
      ...state,
      accountsList: state.accountsList.map((a) =>
        a.id === updated.id ? updated : a,
      ),
    };
  }),

  on(deleteAccount, (state, action) => ({
    ...state,
    accountsList: state.accountsList.filter((a) => a.id !== action.payload.id),
  })),

  on(markAccountSync, (state, action) => ({
    ...state,
    accountsList: state.accountsList.map((a) =>
      a.id === action.payload.id
        ? { ...a, syncStatus: action.payload.status, lastSyncedAt: action.payload.syncedAt }
        : a,
    ),
  })),

  on(logout, () => initialAccountsState),
);
