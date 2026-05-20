import { AssetClass } from '../../../domain/asset-class.domain';
import { IHoldingView, IHoldingLockMeta } from '../../../domain/holding.domain';
import { IInstrument } from '../../../domain/instrument.domain';
import { IPosition } from '../../../domain/position.domain';
import { rightColumnSecondLineFor, sublineFor } from './card-display.helper';

describe('rightColumnSecondLineFor', () => {
  it('STOCK: qty sh × $price', () => {
    const pos = position(AssetClass.STOCK, [
      holding({ quantity: 24, averageBuyPrice: 150 }),
    ]);
    const line = rightColumnSecondLineFor(pos, () => 179);
    expect(line).toBe('24 sh × $179.00');
  });

  it('STOCK: falls back to weightedAvgPrice when no live price', () => {
    const pos = position(AssetClass.STOCK, [
      holding({ quantity: 10, averageBuyPrice: 150 }),
    ]);
    const line = rightColumnSecondLineFor(pos, () => undefined);
    expect(line).toBe('10 sh × $150.00');
  });

  it('CRYPTO: qty SYM × $price (high-precision qty)', () => {
    const pos = position(
      AssetClass.CRYPTO,
      [holding({ quantity: 0.000145, averageBuyPrice: 47500 })],
      { symbol: 'BTC' },
    );
    expect(rightColumnSecondLineFor(pos, () => 47500)).toBe(
      '0.000145 BTC × $47,500',
    );
  });

  it('CASH UAH: ≈ ₴amount', () => {
    const pos = position(
      AssetClass.CASH,
      [holding({ quantity: 395800, averageBuyPrice: 1 })],
      { symbol: 'UAH', currency: 'UAH' },
    );
    expect(rightColumnSecondLineFor(pos, () => 1)).toBe('≈ ₴395,800');
  });

  it('CASH USD: ≈ $amount', () => {
    const pos = position(
      AssetClass.CASH,
      [holding({ quantity: 5000, averageBuyPrice: 1 })],
      { symbol: 'USD', currency: 'USD' },
    );
    expect(rightColumnSecondLineFor(pos, () => 1)).toBe('≈ $5,000');
  });

  it('REAL_ESTATE: empty string', () => {
    const pos = position(AssetClass.REAL_ESTATE, [
      holding({ quantity: 1, averageBuyPrice: 100000 }),
    ]);
    expect(rightColumnSecondLineFor(pos, () => undefined)).toBe('');
  });

  it('DEPOSIT TERM_DEPOSIT: matures Mon YYYY', () => {
    const pos = position(AssetClass.DEPOSIT, [
      holding(
        { quantity: 10000, averageBuyPrice: 1 },
        { kind: 'TERM_DEPOSIT', apr: 7, maturityDate: '2027-12-31' },
      ),
    ]);
    expect(rightColumnSecondLineFor(pos, () => undefined)).toBe(
      'matures Dec 2027',
    );
  });

  it('DEPOSIT without lockMeta: empty string', () => {
    const pos = position(AssetClass.DEPOSIT, [holding({ quantity: 10000, averageBuyPrice: 1 })]);
    expect(rightColumnSecondLineFor(pos, () => undefined)).toBe('');
  });
});

describe('sublineFor', () => {
  it('STOCK single → name only', () => {
    const pos = position(AssetClass.STOCK, [holding({})], {
      name: 'Apple Inc.',
    });
    expect(sublineFor(pos)).toBe('Apple Inc.');
  });

  it('STOCK multi → name · across N locations', () => {
    const pos = position(
      AssetClass.STOCK,
      [holding({}), holding({})],
      { name: 'Apple Inc.' },
    );
    expect(sublineFor(pos)).toBe('Apple Inc. · across 2 locations');
  });

  it('CRYPTO multi → across N locations', () => {
    const pos = position(
      AssetClass.CRYPTO,
      [holding({}), holding({}), holding({})],
      { name: 'Bitcoin', symbol: 'BTC' },
    );
    expect(sublineFor(pos)).toBe('Bitcoin · across 3 locations');
  });

  it('CASH single → instrument.name (account info now lives in chip)', () => {
    const pos = position(
      AssetClass.CASH,
      [holding({ accountName: 'Monobank' })],
      { name: 'USD Cash' },
    );
    expect(sublineFor(pos)).toBe('USD Cash');
  });

  it('CASH multi → name · across N locations', () => {
    const pos = position(
      AssetClass.CASH,
      [
        holding({ accountName: 'Monobank' }),
        holding({ accountName: 'Manual cash' }),
      ],
      { name: 'USD Cash' },
    );
    expect(sublineFor(pos)).toBe('USD Cash · across 2 locations');
  });

  it('OTHER → name · Manual entry', () => {
    const pos = position(AssetClass.OTHER, [holding({})], {
      name: 'Custom asset',
    });
    expect(sublineFor(pos)).toBe('Custom asset · Manual entry');
  });

  it('REAL_ESTATE: includes owned period when openedAt set', () => {
    const longAgo = new Date(Date.now() - 365 * 24 * 3600 * 1000 * 3).toISOString();
    const pos = position(
      AssetClass.REAL_ESTATE,
      [holding({ openedAt: longAgo })],
      { name: 'Apt in Kyiv' },
    );
    expect(sublineFor(pos)).toMatch(/^Apt in Kyiv · owned 3y/);
  });

  it('REAL_ESTATE multi → name · across N locations (no owned period)', () => {
    const pos = position(
      AssetClass.REAL_ESTATE,
      [holding({}), holding({})],
      { name: 'Real estate' },
    );
    expect(sublineFor(pos)).toBe('Real estate · across 2 locations');
  });
});

// ---- Fixtures ----

function holding(
  partial: Partial<IHoldingView>,
  lockMeta?: IHoldingLockMeta,
): IHoldingView {
  return {
    id: partial.id ?? `h-${Math.random()}`,
    instrumentId: partial.instrumentId ?? 'inst-1',
    quantity: partial.quantity ?? 1,
    averageBuyPrice: partial.averageBuyPrice ?? 100,
    currency: partial.currency ?? 'USD',
    tagIds: partial.tagIds ?? [],
    createdAt: partial.createdAt ?? '2026-01-01T00:00:00.000Z',
    updatedAt: partial.updatedAt ?? '2026-01-01T00:00:00.000Z',
    accountKind: partial.accountKind ?? 'MANUAL',
    accountName: partial.accountName,
    openedAt: partial.openedAt,
    instrument: partial.instrument ?? ({} as IInstrument),
    tags: [],
    ...(lockMeta ? { lockMeta } : {}),
  };
}

function position(
  assetClass: AssetClass,
  holdings: IHoldingView[],
  overrides: { name?: string; symbol?: string; currency?: string } = {},
): IPosition {
  const instrument: IInstrument = {
    id: 'inst-1',
    assetClass,
    symbol: overrides.symbol ?? assetClass,
    name: overrides.name ?? 'Test instrument',
    currency: overrides.currency ?? 'USD',
    metadata: { kind: assetClass } as IInstrument['metadata'],
    createdBy: 'user',
    createdAt: '2026-01-01T00:00:00.000Z',
  };
  // Re-wire instrument onto each holding so `inst.symbol` / `inst.currency`
  // reads in the helper hit the override values.
  const linked = holdings.map((h) => ({ ...h, instrument }));
  const totalQty = linked.reduce((s, h) => s + h.quantity, 0);
  return {
    instrument,
    holdings: linked,
    holdingValues: linked.map(() => 0),
    totalQuantity: totalQty,
    totalValue: 0,
    totalCostBasis: linked.reduce((s, h) => s + h.quantity * h.averageBuyPrice, 0),
    weightedAvgPrice: linked[0]?.averageBuyPrice ?? 0,
    paperPnL: 0,
    paperPnLPct: 0,
    tags: [],
  };
}
