import { AssetClass } from '../../../domain/asset-class.domain';
import { IHolding } from '../../../domain/holding.domain';
import { logout } from '../../../store/user.actions';
import {
  addHolding,
  assignTags,
  deleteHolding,
  editHolding,
  loadHoldings,
} from './holdings.actions';
import { IHoldingsState, holdingsReducer } from './holdings.reducer';

function makeHolding(id: string, opts: Partial<IHolding> = {}): IHolding {
  return {
    id,
    instrumentId: opts.instrumentId ?? 'inst-1',
    accountId: opts.accountId ?? 'manual',
    quantity: opts.quantity ?? 10,
    averageBuyPrice: opts.averageBuyPrice ?? 100,
    currency: opts.currency ?? 'USD',
    tagIds: opts.tagIds ?? [],
    createdAt: opts.createdAt ?? '2026-05-15T00:00:00.000Z',
    updatedAt: opts.updatedAt ?? '2026-05-15T00:00:00.000Z',
  };
}

describe('holdingsReducer', () => {
  const initial: IHoldingsState = { holdingsList: [] };

  it('loadHoldings replaces state', () => {
    const next = holdingsReducer(
      initial,
      loadHoldings({ state: { holdingsList: [makeHolding('h1')] } }),
    );
    expect(next.holdingsList.length).toBe(1);
  });

  it('addHolding appends', () => {
    const next = holdingsReducer(
      { holdingsList: [makeHolding('h1')] },
      addHolding({ holding: makeHolding('h2') }),
    );
    expect(next.holdingsList.length).toBe(2);
  });

  it('editHolding with addQuantity>0 recomputes avgBuyPrice', () => {
    // 10 @ $100, buying 5 more @ $200 → (10*100 + 5*200) / 15 = 2000/15 ≈ 133.33
    const start: IHoldingsState = {
      holdingsList: [makeHolding('h1', { quantity: 10, averageBuyPrice: 100 })],
    };
    const next = holdingsReducer(
      start,
      editHolding({
        id: 'h1',
        addQuantity: 5,
        addPrice: 200,
        patch: {},
      }),
    );
    const updated = next.holdingsList[0];
    expect(updated.quantity).toBe(15);
    expect(updated.averageBuyPrice).toBeCloseTo(133.333, 2);
  });

  it('editHolding with addQuantity=0 keeps quantity and avgBuyPrice (pure edit)', () => {
    const start: IHoldingsState = {
      holdingsList: [makeHolding('h1', { quantity: 10, averageBuyPrice: 100 })],
    };
    const next = holdingsReducer(
      start,
      editHolding({
        id: 'h1',
        addQuantity: 0,
        addPrice: 0,
        patch: { currency: 'EUR' },
      }),
    );
    const updated = next.holdingsList[0];
    expect(updated.quantity).toBe(10);
    expect(updated.averageBuyPrice).toBe(100);
    expect(updated.currency).toBe('EUR');
  });

  it('editHolding bumps updatedAt', () => {
    const start: IHoldingsState = {
      holdingsList: [
        makeHolding('h1', { updatedAt: '2020-01-01T00:00:00.000Z' }),
      ],
    };
    const next = holdingsReducer(
      start,
      editHolding({ id: 'h1', addQuantity: 0, addPrice: 0, patch: {} }),
    );
    expect(next.holdingsList[0].updatedAt).not.toBe('2020-01-01T00:00:00.000Z');
  });

  it('editHolding for missing id is no-op', () => {
    const start: IHoldingsState = { holdingsList: [makeHolding('h1')] };
    const next = holdingsReducer(
      start,
      editHolding({ id: 'missing', addQuantity: 0, addPrice: 0, patch: {} }),
    );
    expect(next).toBe(start);
  });

  it('deleteHolding removes by id', () => {
    const next = holdingsReducer(
      { holdingsList: [makeHolding('h1'), makeHolding('h2')] },
      deleteHolding({ id: 'h1' }),
    );
    expect(next.holdingsList.map((h) => h.id)).toEqual(['h2']);
  });

  it('assignTags replaces tagIds idempotently', () => {
    const start: IHoldingsState = {
      holdingsList: [makeHolding('h1', { tagIds: ['t1', 't2'] })],
    };
    const next = holdingsReducer(
      start,
      assignTags({ holdingId: 'h1', tagIds: ['t3'] }),
    );
    expect(next.holdingsList[0].tagIds).toEqual(['t3']);
  });

  it('logout resets to initial', () => {
    const next = holdingsReducer(
      { holdingsList: [makeHolding('h1')] },
      logout(),
    );
    expect(next.holdingsList).toEqual([]);
  });

  it('uses AssetClass enum import (smoke)', () => {
    // Ensures spec imports compile; AssetClass is referenced just so the
    // import doesn't get tree-shaken by TS strict-unused checks.
    expect(AssetClass.STOCK).toBe('STOCK');
  });
});
