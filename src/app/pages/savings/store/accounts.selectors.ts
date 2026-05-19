import { createFeatureSelector, createSelector } from '@ngrx/store';
import { IAccountV2, SyncStatus } from '../../../domain/account-v2.domain';
import { IHolding } from '../../../domain/holding.domain';
import { selectHoldingsList } from './holdings.selectors';
import { IAccountsState } from './accounts.reducer';

export const selectAccountsState =
  createFeatureSelector<IAccountsState>('accounts');

export const selectAccountsList = createSelector(
  selectAccountsState,
  (state) => state?.accountsList ?? [],
);

export const selectAccountById = (id: string) =>
  createSelector(selectAccountsList, (list) => list.find((a) => a.id === id));

/**
 * Accounts whose last sync attempt failed or is too old to trust —
 * drives the amber notification badge on `<pgz-accounts-chip>`.
 * NEVER and MANUAL are excluded on purpose: "never tried" is not the
 * same as "broke", and a fresh signup shouldn't see an angry dot.
 */
const STALE_STATUSES: ReadonlySet<SyncStatus> = new Set<SyncStatus>(['STALE', 'ERROR']);

export const selectStaleAccounts = createSelector(
  selectAccountsList,
  (list) => list.filter((a) => a.syncStatus !== undefined && STALE_STATUSES.has(a.syncStatus)),
);

export const selectStaleAccountsCount = createSelector(
  selectStaleAccounts,
  (list) => list.length,
);

/**
 * Per-account holdings count for the bottom-sheet row meta ("12 holdings")
 * and the delete-confirm "you'll wipe N positions" warning. Pure join over
 * the holdings list — no extra service calls.
 */
export interface IAccountWithCount extends IAccountV2 {
  holdingCount: number;
}

export const selectAccountsWithCount = createSelector(
  selectAccountsList,
  selectHoldingsList,
  (accounts, holdings): IAccountWithCount[] => {
    const counts = new Map<string, number>();
    for (const h of holdings as IHolding[]) {
      if (h.accountId) {
        counts.set(h.accountId, (counts.get(h.accountId) ?? 0) + 1);
      }
    }
    return accounts.map((a) => ({ ...a, holdingCount: counts.get(a.id) ?? 0 }));
  },
);
