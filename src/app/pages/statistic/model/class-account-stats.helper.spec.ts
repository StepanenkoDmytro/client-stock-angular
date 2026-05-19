import { IAccountV2 } from '../../../domain/account-v2.domain';
import { AssetClass } from '../../../domain/asset-class.domain';
import { IHolding } from '../../../domain/holding.domain';
import { IInstrument } from '../../../domain/instrument.domain';
import { computeClassAccountMatrix } from './class-account-stats.helper';

function inst(id: string, ac: AssetClass): IInstrument {
  return {
    id,
    assetClass: ac,
    symbol: id.toUpperCase(),
    name: id,
    currency: 'USD',
    metadata:
      ac === AssetClass.CRYPTO
        ? { kind: AssetClass.CRYPTO, coinId: id }
        : { kind: AssetClass.STOCK, exchange: 'NYSE', currency: 'USD' },
    createdBy: 'system',
    createdAt: '2026-05-15T00:00:00.000Z',
  };
}

function holding(
  id: string,
  instrumentId: string,
  accountId: string,
  quantity: number,
  price: number,
): IHolding {
  return {
    id,
    instrumentId,
    accountId,
    quantity,
    averageBuyPrice: price,
    currency: 'USD',
    tagIds: [],
    createdAt: '2026-05-15T00:00:00.000Z',
    updatedAt: '2026-05-15T00:00:00.000Z',
  };
}

function account(id: string, name: string, type: IAccountV2['accountType'] = 'BROKERAGE'): IAccountV2 {
  return { id, accountNumber: name, accountType: type, currency: 'USD' };
}

describe('computeClassAccountMatrix', () => {
  const instruments = new Map<string, IInstrument>([
    ['aapl', inst('aapl', AssetClass.STOCK)],
    ['vti',  inst('vti',  AssetClass.STOCK)],
    ['btc',  inst('btc',  AssetClass.CRYPTO)],
    ['eth',  inst('eth',  AssetClass.CRYPTO)],
    ['cash', inst('cash', AssetClass.CASH)],
  ]);
  const accounts: IAccountV2[] = [
    account('acc-ibkr', 'Interactive Brokers'),
    account('acc-schwab', 'Schwab'),
    account('acc-bybit', 'Bybit Spot', 'EXCHANGE'),
    account('acc-trezor', 'Trezor', 'WALLET'),
    account('acc-mono', 'Monobank', 'BANK'),
  ];

  it('cross-tabulates holdings × accounts per class', () => {
    const holdings: IHolding[] = [
      holding('h1', 'aapl', 'acc-ibkr',   10, 150),  // STOCK · IBKR · $1500
      holding('h2', 'vti',  'acc-schwab',  5, 200),  // STOCK · Schwab · $1000
      holding('h3', 'btc',  'acc-bybit',   1, 40000),// CRYPTO · Bybit · $40000
      holding('h4', 'eth',  'acc-trezor',  3, 2000), // CRYPTO · Trezor · $6000
      holding('h5', 'cash', 'acc-mono', 9895,    1), // CASH · Mono · $9895
    ];

    const result = computeClassAccountMatrix(holdings, accounts, instruments);
    const byClass = new Map(result.map((c) => [c.classKey, c]));

    const stock = byClass.get(AssetClass.STOCK)!;
    expect(stock).toBeDefined();
    expect(stock.totalValue).toBe(2500);
    expect(stock.segments.map((s) => s.accountId)).toEqual(['acc-ibkr', 'acc-schwab']);
    expect(stock.segments[0].share).toBeCloseTo(0.6, 5);

    const crypto = byClass.get(AssetClass.CRYPTO)!;
    expect(crypto.totalValue).toBe(46000);
    // Sorted desc by value: Bybit ($40k) before Trezor ($6k).
    expect(crypto.segments.map((s) => s.accountId)).toEqual(['acc-bybit', 'acc-trezor']);

    const cash = byClass.get(AssetClass.CASH)!;
    expect(cash.totalValue).toBe(9895);
    expect(cash.segments.length).toBe(1);
  });

  it('drops classes with no holdings (empty buckets are not emitted)', () => {
    const holdings: IHolding[] = [
      holding('h1', 'aapl', 'acc-ibkr', 1, 100),
    ];
    const result = computeClassAccountMatrix(holdings, accounts, instruments);
    expect(result.map((c) => c.classKey)).toEqual([AssetClass.STOCK]);
  });

  it('skips holdings with zero or negative cost basis', () => {
    const holdings: IHolding[] = [
      holding('h0', 'aapl', 'acc-ibkr', 0, 100),
      holding('h1', 'vti',  'acc-ibkr', 5, 0),
      holding('h2', 'btc',  'acc-bybit', 1, 40000),
    ];
    const result = computeClassAccountMatrix(holdings, accounts, instruments);
    expect(result.map((c) => c.classKey)).toEqual([AssetClass.CRYPTO]);
  });

  it('segments within a class sum to totalValue', () => {
    const holdings: IHolding[] = [
      holding('h1', 'aapl', 'acc-ibkr',   10, 150),
      holding('h2', 'vti',  'acc-schwab',  5, 200),
      holding('h3', 'aapl', 'acc-schwab',  2, 150),
    ];
    const result = computeClassAccountMatrix(holdings, accounts, instruments);
    const stock = result.find((c) => c.classKey === AssetClass.STOCK)!;
    const segSum = stock.segments.reduce((acc, s) => acc + s.value, 0);
    expect(segSum).toBeCloseTo(stock.totalValue, 5);
    // shares sum to 1
    const shareSum = stock.segments.reduce((acc, s) => acc + s.share, 0);
    expect(shareSum).toBeCloseTo(1, 5);
  });

  it('classes are sorted desc by totalValue', () => {
    const holdings: IHolding[] = [
      holding('h-cash', 'cash', 'acc-mono', 100, 1),     // $100
      holding('h-stock', 'aapl', 'acc-ibkr', 1, 1500),   // $1500
      holding('h-crypto', 'btc', 'acc-bybit', 1, 10000), // $10000
    ];
    const result = computeClassAccountMatrix(holdings, accounts, instruments);
    expect(result.map((c) => c.classKey)).toEqual([
      AssetClass.CRYPTO,
      AssetClass.STOCK,
      AssetClass.CASH,
    ]);
  });

  it('handles unknown account id with synthetic "(unknown account)" label', () => {
    const holdings: IHolding[] = [
      holding('h1', 'aapl', 'acc-deleted-orphan', 1, 100),
    ];
    const result = computeClassAccountMatrix(holdings, accounts, instruments);
    expect(result[0].segments[0].accountName).toBe('(unknown account)');
  });

  it('drops holdings whose instrument resolves missing', () => {
    const holdings: IHolding[] = [
      holding('h1', 'phantom', 'acc-ibkr', 1, 100),
      holding('h2', 'aapl', 'acc-ibkr', 1, 200),
    ];
    const result = computeClassAccountMatrix(holdings, accounts, instruments);
    expect(result.length).toBe(1);
    expect(result[0].totalValue).toBe(200);
  });
});
