import { TestBed } from '@angular/core/testing';
import { AssetClass } from '../../../domain/asset-class.domain';
import { IHoldingView } from '../../../domain/holding.domain';
import { IInstrument } from '../../../domain/instrument.domain';
import { PositionsService } from './positions.service';

/**
 * Lightweight HoldingView factory. Defaults keep the position computable
 * (qty=1, avgBuyPrice=100) so individual tests only tweak what they care
 * about.
 */
function makeHolding(
  instrumentId: string,
  symbol: string,
  overrides: Partial<IHoldingView> = {},
): IHoldingView {
  const instrument: IInstrument = {
    id: instrumentId,
    assetClass: AssetClass.STOCK,
    symbol,
    name: symbol,
    currency: 'USD',
    metadata: {
      kind: AssetClass.STOCK,
      exchange: 'NYSE',
      currency: 'USD',
    },
    createdBy: 'system',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...(overrides.instrument ?? {}),
  };
  return {
    id: overrides.id ?? `${instrumentId}-${Math.random()}`,
    instrumentId,
    quantity: 1,
    averageBuyPrice: 100,
    currency: 'USD',
    tagIds: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    instrument,
    tags: [],
    ...overrides,
  };
}

describe('PositionsService', () => {
  let service: PositionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [PositionsService] });
    service = TestBed.inject(PositionsService);
  });

  it('returns [] for empty input', () => {
    expect(service.fromHoldings([], () => 1)).toEqual([]);
  });

  it('builds one Position per Instrument from a single holding', () => {
    const h = makeHolding('inst-aapl', 'AAPL', { quantity: 10, averageBuyPrice: 150 });
    const result = service.fromHoldings([h], () => 175);
    expect(result.length).toBe(1);
    expect(result[0].instrument.symbol).toBe('AAPL');
    expect(result[0].holdings.length).toBe(1);
    expect(result[0].totalQuantity).toBe(10);
    expect(result[0].totalValue).toBe(1750);
    expect(result[0].totalCostBasis).toBe(1500);
    expect(result[0].weightedAvgPrice).toBe(150);
    expect(result[0].paperPnL).toBe(250);
    expect(result[0].paperPnLPct).toBeCloseTo(0.1667, 3);
  });

  it('aggregates multiple holdings of the same Instrument into one Position', () => {
    const h1 = makeHolding('inst-btc', 'BTC', {
      quantity: 0.5,
      averageBuyPrice: 40000,
    });
    const h2 = makeHolding('inst-btc', 'BTC', {
      quantity: 0.3,
      averageBuyPrice: 30000,
    });
    const result = service.fromHoldings([h1, h2], () => 60000);
    expect(result.length).toBe(1);
    expect(result[0].holdings.length).toBe(2);
    expect(result[0].totalQuantity).toBeCloseTo(0.8, 5);
    expect(result[0].totalValue).toBeCloseTo(48000, 5);
    expect(result[0].totalCostBasis).toBeCloseTo(29000, 5);
    // weighted avg = (0.5*40000 + 0.3*30000) / 0.8 = 36250
    expect(result[0].weightedAvgPrice).toBeCloseTo(36250, 5);
  });

  it('keeps Positions of different Instruments separate', () => {
    const aapl = makeHolding('inst-aapl', 'AAPL');
    const btc = makeHolding('inst-btc', 'BTC');
    const result = service.fromHoldings([aapl, btc], () => 100);
    expect(result.length).toBe(2);
  });

  it('sorts Positions by totalValue desc — largest first', () => {
    const small = makeHolding('inst-small', 'SML', {
      quantity: 1,
      averageBuyPrice: 10,
    });
    const big = makeHolding('inst-big', 'BIG', {
      quantity: 10,
      averageBuyPrice: 100,
    });
    const result = service.fromHoldings(
      [small, big],
      (s) => (s === 'BIG' ? 200 : 12),
    );
    expect(result[0].instrument.symbol).toBe('BIG');
    expect(result[1].instrument.symbol).toBe('SML');
  });

  it('sorts holdings inside one Position by per-holding currentValue desc', () => {
    const small = makeHolding('inst-btc', 'BTC', {
      id: 'small',
      quantity: 0.1,
      averageBuyPrice: 30000,
    });
    const big = makeHolding('inst-btc', 'BTC', {
      id: 'big',
      quantity: 0.5,
      averageBuyPrice: 40000,
    });
    const result = service.fromHoldings([small, big], () => 60000);
    expect(result[0].holdings.length).toBe(2);
    expect(result[0].holdings[0].id).toBe('big');
    expect(result[0].holdings[1].id).toBe('small');
    expect(result[0].holdingValues[0]).toBeGreaterThan(
      result[0].holdingValues[1],
    );
  });

  it('falls back to averageBuyPrice when priceFor returns undefined', () => {
    const h = makeHolding('inst-x', 'X', {
      quantity: 2,
      averageBuyPrice: 50,
    });
    const result = service.fromHoldings([h], () => undefined);
    // 2 × 50 fallback = 100
    expect(result[0].totalValue).toBe(100);
    expect(result[0].paperPnL).toBe(0);
  });

  it('returns paperPnLPct = 0 when costBasis is 0 (no NaN)', () => {
    const h = makeHolding('inst-free', 'FREE', {
      quantity: 1,
      averageBuyPrice: 0,
    });
    const result = service.fromHoldings([h], () => 10);
    expect(result[0].totalCostBasis).toBe(0);
    expect(result[0].paperPnLPct).toBe(0);
    expect(Number.isNaN(result[0].paperPnLPct)).toBe(false);
  });

  it('returns weightedAvgPrice = 0 when totalQuantity is 0 (no NaN)', () => {
    const h = makeHolding('inst-zero', 'ZERO', {
      quantity: 0,
      averageBuyPrice: 100,
    });
    const result = service.fromHoldings([h], () => 50);
    expect(result[0].weightedAvgPrice).toBe(0);
    expect(Number.isNaN(result[0].weightedAvgPrice)).toBe(false);
  });

  it('keeps tokenized and underlying as separate Positions even if they share a symbol root', () => {
    const real = makeHolding('inst-aapl', 'AAPL');
    const token: IHoldingView = {
      ...makeHolding('inst-aapl-x', 'AAPL.X'),
      instrument: {
        id: 'inst-aapl-x',
        assetClass: AssetClass.TOKENIZED_STOCK,
        symbol: 'AAPL.X',
        name: 'Apple (tokenised)',
        currency: 'USD',
        metadata: {
          kind: AssetClass.TOKENIZED_STOCK,
          underlyingSymbol: 'AAPL',
          tokenSymbol: 'AAPL.X',
          exchange: 'Bybit',
          blockchain: 'Ethereum',
        },
        createdBy: 'system',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    };
    const result = service.fromHoldings([real, token], () => 100);
    expect(result.length).toBe(2);
    expect(result.map((p) => p.instrument.assetClass).sort()).toEqual(
      [AssetClass.STOCK, AssetClass.TOKENIZED_STOCK].sort(),
    );
  });

  it('deduplicates tags across holdings inside one Position', () => {
    const tagA = { id: 'tag-a', name: 'A', color: '#000', system: false, createdAt: '' };
    const tagB = { id: 'tag-b', name: 'B', color: '#000', system: false, createdAt: '' };
    const h1 = makeHolding('inst-btc', 'BTC', { tags: [tagA, tagB] });
    const h2 = makeHolding('inst-btc', 'BTC', { tags: [tagA] });
    const result = service.fromHoldings([h1, h2], () => 60000);
    expect(result[0].tags.length).toBe(2);
    expect(result[0].tags.map((t) => t.id).sort()).toEqual(['tag-a', 'tag-b']);
  });
});
