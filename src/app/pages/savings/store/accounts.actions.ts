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

/**
 * Marks an account's sync attempt outcome. PR-A6 ships this as a STUB —
 * `AccountsService.retrySync` just bumps {@code lastSyncedAt} + sets
 * status to `OK` without an actual upstream call. M7+ provider PRs
 * (IBKR / Bybit / Mono integrations) replace the stub with real sync.
 */
export const markAccountSync = createAction(
  '[ACCOUNTS] Mark Sync',
  (payload: { id: string; syncedAt: string; status: 'OK' | 'STALE' | 'ERROR' | 'NEVER' }) => ({ payload }),
);
