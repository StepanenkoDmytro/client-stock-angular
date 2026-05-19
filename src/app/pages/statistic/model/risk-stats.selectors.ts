import { createSelector } from '@ngrx/store';
import { AssetClass } from '../../../domain/asset-class.domain';
import { IInstrument } from '../../../domain/instrument.domain';
import { selectAccountsList } from '../../savings/store/accounts.selectors';
import { selectHoldingsList } from '../../savings/store/holdings.selectors';
import {
  CustodyMix,
  SpofExposure,
  computeCustodyMix,
  computeSpof,
} from './risk-stats.helper';

/**
 * Factory selector — pass the InstrumentService snapshot, get a memoised
 * (holdings, accounts) → {@link CustodyMix} | null selector for the
 * given AssetClass. Same factory pattern as `selectClassAccountMatrix`
 * (Task 1) — keeps the instrument map outside the NgRx tree.
 */
export const selectCustodyMixForClass = (
  cls: AssetClass,
  instruments: ReadonlyMap<string, IInstrument>,
) =>
  createSelector(
    selectHoldingsList,
    selectAccountsList,
    (holdings, accounts): CustodyMix | null =>
      computeCustodyMix(cls, holdings, accounts, instruments),
  );

/**
 * Factory selector for the largest-single-account SPOF exposure across
 * the entire portfolio. Returns `null` for an empty portfolio.
 */
export const selectSpof = (instruments: ReadonlyMap<string, IInstrument>) =>
  createSelector(
    selectHoldingsList,
    selectAccountsList,
    (holdings, accounts): SpofExposure | null =>
      computeSpof(holdings, accounts, instruments),
  );
