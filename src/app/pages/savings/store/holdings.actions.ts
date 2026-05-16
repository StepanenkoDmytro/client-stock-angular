import { createAction } from '@ngrx/store';
import { IHolding } from '../../../domain/holding.domain';
import { IHoldingsState } from './holdings.reducer';

export const loadHoldings = createAction(
  '[HOLDINGS] Load Holdings',
  (payload: { state: IHoldingsState }) => ({ payload }),
);

export const addHolding = createAction(
  '[HOLDINGS] Add Holding',
  (payload: { holding: IHolding }) => ({ payload }),
);

/**
 * Edit-with-purchase: when `payload.addQuantity > 0`, the reducer applies
 * the avg-buy-price formula. When `addQuantity === 0`, it's a pure-edit
 * (rename, change currency, etc.) without recomputing avgBuyPrice.
 */
export const editHolding = createAction(
  '[HOLDINGS] Edit Holding',
  (payload: {
    id: string;
    addQuantity: number;
    addPrice: number;
    patch: Partial<IHolding>;
  }) => ({ payload }),
);

export const deleteHolding = createAction(
  '[HOLDINGS] Delete Holding',
  (payload: { id: string }) => ({ payload }),
);

/**
 * Replace the entire tagIds list of a holding. Idempotent (mirrors
 * `PUT /api/v1/holdings/{id}/tags` per ADR-0007 §119).
 */
export const assignTags = createAction(
  '[HOLDINGS] Assign Tags',
  (payload: { holdingId: string; tagIds: string[] }) => ({ payload }),
);
