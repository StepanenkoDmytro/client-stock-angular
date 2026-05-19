import { createSelector } from '@ngrx/store';
import { IInstrument } from '../../../domain/instrument.domain';
import { selectAccountsList } from '../../savings/store/accounts.selectors';
import { selectHoldingsList } from '../../savings/store/holdings.selectors';
import {
  ClassBreakdown,
  computeClassAccountMatrix,
} from './class-account-stats.helper';

/**
 * Factory selector for {@link ClassBreakdown}[] — cross-tabulates
 * holdings × accounts by AssetClass. Used by Stats Task 1 W3
 * ("Per-class account breakdown").
 *
 * <p>Why factory: the instruments map is owned by `InstrumentService`
 * (Signal, not Store). Callers pass the current snapshot — same pattern
 * as `selectHoldingsView` in `holdings.selectors.ts`.
 *
 * <p>Memoisation: the inner createSelector memoises on the (holdings,
 * accounts) tuple from the store. The factory itself isn't memoised
 * across instrument-map identity changes — callers should cache the
 * factory return value if they invoke it in a hot loop.
 */
export const selectClassAccountMatrix = (
  instruments: ReadonlyMap<string, IInstrument>,
) =>
  createSelector(
    selectHoldingsList,
    selectAccountsList,
    (holdings, accounts): ClassBreakdown[] =>
      computeClassAccountMatrix(holdings, accounts, instruments),
  );
