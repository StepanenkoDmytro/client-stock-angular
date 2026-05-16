import { AssetClass } from '../../../domain/asset-class.domain';
import { IHolding } from '../../../domain/holding.domain';
import { IInstrument } from '../../../domain/instrument.domain';
import { ITag } from '../../../domain/tag.domain';
import { IHoldingsState } from './holdings.reducer';
import {
  selectHoldingById,
  selectHoldingsByAssetClass,
  selectHoldingsByTag,
  selectHoldingsList,
  selectHoldingsView,
} from './holdings.selectors';
import { ITagsState } from './tags.reducer';

function makeHolding(id: string, opts: Partial<IHolding> = {}): IHolding {
  return {
    id,
    instrumentId: opts.instrumentId ?? 'inst-1',
    accountId: 'manual',
    quantity: opts.quantity ?? 1,
    averageBuyPrice: opts.averageBuyPrice ?? 100,
    currency: 'USD',
    tagIds: opts.tagIds ?? [],
    createdAt: '2026-05-15T00:00:00.000Z',
    updatedAt: '2026-05-15T00:00:00.000Z',
  };
}

function makeInstrument(id: string, assetClass = AssetClass.STOCK): IInstrument {
  return {
    id,
    assetClass,
    symbol: id.toUpperCase(),
    name: id,
    currency: 'USD',
    metadata:
      assetClass === AssetClass.CRYPTO
        ? { kind: AssetClass.CRYPTO, coinId: id }
        : { kind: AssetClass.STOCK, exchange: 'NYSE', currency: 'USD' },
    createdBy: 'system',
    createdAt: '2026-05-15T00:00:00.000Z',
  };
}

function makeTag(id: string, name: string): ITag {
  return {
    id,
    name,
    parentId: undefined,
    color: '#888',
    system: false,
    createdAt: '2026-05-15T00:00:00.000Z',
  };
}

function makeState(
  holdings: IHolding[],
  tags: ITag[] = [],
): { holdings: IHoldingsState; tags: ITagsState } {
  return {
    holdings: { holdingsList: holdings },
    tags: { tagsList: tags },
  };
}

describe('holdings.selectors', () => {
  it('selectHoldingsList returns the list', () => {
    const state = makeState([makeHolding('h1')]);
    expect(selectHoldingsList(state).map((h) => h.id)).toEqual(['h1']);
  });

  it('selectHoldingsList returns [] when state missing', () => {
    expect(selectHoldingsList({ holdings: undefined as any })).toEqual([]);
  });

  it('selectHoldingById finds by id', () => {
    const state = makeState([makeHolding('a'), makeHolding('b')]);
    expect(selectHoldingById('b')(state)?.id).toBe('b');
    expect(selectHoldingById('x')(state)).toBeUndefined();
  });

  it('selectHoldingsByTag filters by tagId', () => {
    const state = makeState([
      makeHolding('h1', { tagIds: ['t1', 't2'] }),
      makeHolding('h2', { tagIds: ['t2'] }),
      makeHolding('h3', { tagIds: [] }),
    ]);
    expect(selectHoldingsByTag('t1')(state).map((h) => h.id)).toEqual(['h1']);
    expect(selectHoldingsByTag('t2')(state).map((h) => h.id)).toEqual([
      'h1',
      'h2',
    ]);
  });

  it('selectHoldingsByAssetClass filters via instrument map', () => {
    const instruments = new Map<string, IInstrument>([
      ['inst-stock', makeInstrument('inst-stock', AssetClass.STOCK)],
      ['inst-crypto', makeInstrument('inst-crypto', AssetClass.CRYPTO)],
    ]);
    const state = makeState([
      makeHolding('h1', { instrumentId: 'inst-stock' }),
      makeHolding('h2', { instrumentId: 'inst-crypto' }),
    ]);
    const result = selectHoldingsByAssetClass(AssetClass.STOCK, instruments)(state);
    expect(result.map((h) => h.id)).toEqual(['h1']);
  });

  it('selectHoldingsView joins with instruments and tags', () => {
    const instruments = new Map<string, IInstrument>([
      ['inst-1', makeInstrument('inst-1')],
    ]);
    const state = makeState(
      [makeHolding('h1', { instrumentId: 'inst-1', tagIds: ['t1'] })],
      [makeTag('t1', 'Long-term')],
    );
    const view = selectHoldingsView(instruments)(state);
    expect(view.length).toBe(1);
    expect(view[0].instrument.id).toBe('inst-1');
    expect(view[0].tags.map((t) => t.name)).toEqual(['Long-term']);
  });

  it('selectHoldingsView drops holdings with missing instrument', () => {
    const instruments = new Map<string, IInstrument>();
    const state = makeState([
      makeHolding('h1', { instrumentId: 'gone' }),
    ]);
    expect(selectHoldingsView(instruments)(state)).toEqual([]);
  });

  it('selectHoldingsView drops missing tags silently', () => {
    const instruments = new Map<string, IInstrument>([
      ['inst-1', makeInstrument('inst-1')],
    ]);
    const state = makeState(
      [makeHolding('h1', { instrumentId: 'inst-1', tagIds: ['t1', 'gone'] })],
      [makeTag('t1', 'Long-term')],
    );
    const view = selectHoldingsView(instruments)(state);
    expect(view[0].tags.map((t) => t.name)).toEqual(['Long-term']);
  });
});
