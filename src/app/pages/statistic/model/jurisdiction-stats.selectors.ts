import { createSelector } from '@ngrx/store';
import { IInstrument } from '../../../domain/instrument.domain';
import { selectAccountsList } from '../../savings/store/accounts.selectors';
import { selectHoldingsList } from '../../savings/store/holdings.selectors';
import {
  JurisdictionBreakdown,
  computeJurisdictionBreakdown,
} from './jurisdiction-stats.helper';

/**
 * Factory selector for the W6 jurisdiction-concentration breakdown.
 * Same instruments-map factory pattern as Task 1's
 * `selectClassAccountMatrix` and Task 2's `selectCustodyMixForClass`.
 */
export const selectJurisdictionBreakdown = (
  instruments: ReadonlyMap<string, IInstrument>,
) =>
  createSelector(
    selectHoldingsList,
    selectAccountsList,
    (holdings, accounts): JurisdictionBreakdown | null =>
      computeJurisdictionBreakdown(holdings, accounts, instruments),
  );
