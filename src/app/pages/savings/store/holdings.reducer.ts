import { createReducer, on } from '@ngrx/store';
import { IHolding } from '../../../domain/holding.domain';
import { logout } from '../../../store/user.actions';
import {
  addHolding,
  assignTags,
  deleteHolding,
  editHolding,
  loadHoldings,
} from './holdings.actions';

export interface IHoldingsState {
  holdingsList: IHolding[];
}

const initialHoldingsState: IHoldingsState = {
  holdingsList: [],
};

/**
 * Holdings reducer.
 *
 * The `editHolding` action carries an explicit `addQuantity` + `addPrice`
 * pair so the reducer can decide between two modes:
 *
 *  - `addQuantity > 0` — user is **adding** to an existing position. We
 *    recompute the average buy price:
 *
 *      avg = (oldQty * oldAvg + newQty * newPrice) / (oldQty + newQty)
 *
 *    This mirrors the legacy `asset.reducer.ts:33–42` behaviour, but is
 *    now opt-in rather than implicit.
 *
 *  - `addQuantity === 0` — **pure edit** (rename, retag, fix currency).
 *    Apply `patch` only, leave quantity and averageBuyPrice alone.
 *
 * `updatedAt` is bumped on every successful edit.
 */
export const holdingsReducer = createReducer<IHoldingsState>(
  initialHoldingsState,

  on(loadHoldings, (_state, action) => ({ ...action.payload.state })),

  on(addHolding, (state, action) => {
    const list = Array.isArray(state.holdingsList) ? state.holdingsList : [];
    return {
      ...state,
      holdingsList: [...list, action.payload.holding],
    };
  }),

  on(editHolding, (state, action) => {
    const { id, addQuantity, addPrice, patch } = action.payload;
    const target = state.holdingsList.find((h) => h.id === id);
    if (!target) {
      return state;
    }

    let quantity = target.quantity;
    let averageBuyPrice = target.averageBuyPrice;

    if (addQuantity > 0) {
      const oldCost = target.quantity * target.averageBuyPrice;
      const addCost = addQuantity * addPrice;
      const totalQty = target.quantity + addQuantity;
      quantity = totalQty;
      averageBuyPrice = totalQty > 0 ? (oldCost + addCost) / totalQty : 0;
    }

    const now = new Date().toISOString();
    const updated: IHolding = {
      ...target,
      ...patch,
      id: target.id,
      quantity,
      averageBuyPrice,
      updatedAt: now,
    };

    return {
      ...state,
      holdingsList: state.holdingsList.map((h) =>
        h.id === id ? updated : h,
      ),
    };
  }),

  on(deleteHolding, (state, action) => ({
    ...state,
    holdingsList: state.holdingsList.filter((h) => h.id !== action.payload.id),
  })),

  on(assignTags, (state, action) => {
    const { holdingId, tagIds } = action.payload;
    const now = new Date().toISOString();
    return {
      ...state,
      holdingsList: state.holdingsList.map((h) =>
        h.id === holdingId
          ? { ...h, tagIds: [...tagIds], updatedAt: now }
          : h,
      ),
    };
  }),

  on(logout, () => ({ ...initialHoldingsState })),
);
