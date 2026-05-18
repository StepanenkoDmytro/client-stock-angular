import { AssetClass } from '../../../../../domain/asset-class.domain';
import { IHoldingView, IHoldingLockMeta } from '../../../../../domain/holding.domain';
import { IInstrument } from '../../../../../domain/instrument.domain';
import { IPosition } from '../../../../../domain/position.domain';
import { incomeLineFor } from './income-line.helper';

describe('incomeLineFor', () => {
  it('shows yield for STOCK with positive dividend', () => {
    const pos = stockPos({ dividendYield: 0.03 });
    expect(incomeLineFor(pos)).toEqual({ show: true, label: '3.0% yield' });
  });

  it('hides for STOCK with zero/missing dividend', () => {
    expect(incomeLineFor(stockPos({ dividendYield: 0 }))).toEqual({
      show: false,
      label: '',
    });
    expect(incomeLineFor(stockPos({}))).toEqual({ show: false, label: '' });
  });

  it('shows yield for ETF same as STOCK', () => {
    const pos = etfPos({ dividendYield: 0.0125 });
    expect(incomeLineFor(pos)).toEqual({ show: true, label: '1.3% yield' });
  });

  it('always hides for TOKENIZED_STOCK', () => {
    expect(incomeLineFor(tokenizedPos())).toEqual({ show: false, label: '' });
  });

  it('shows APR + lock period for CRYPTO STAKING', () => {
    const pos = cryptoPos([
      { kind: 'STAKING', apr: 5, lockPeriod: '30-day lock' },
    ]);
    expect(incomeLineFor(pos)).toEqual({
      show: true,
      label: '5% APR · 30-day lock',
    });
  });

  it('shows APR (no period) for CRYPTO STAKING without lockPeriod', () => {
    const pos = cryptoPos([{ kind: 'STAKING', apr: 4 }]);
    expect(incomeLineFor(pos)).toEqual({ show: true, label: '4% APR' });
  });

  it('shows APR for CRYPTO FLEXIBLE', () => {
    const pos = cryptoPos([{ kind: 'FLEXIBLE', apr: 6 }]);
    expect(incomeLineFor(pos)).toEqual({ show: true, label: '6% APR' });
  });

  it('hides for CRYPTO with no lockMeta', () => {
    const pos = cryptoPos([undefined]);
    expect(incomeLineFor(pos)).toEqual({ show: false, label: '' });
  });

  it('shows APY for CASH with FLEXIBLE APR', () => {
    const pos = cashPos([{ kind: 'FLEXIBLE', apr: 5 }]);
    expect(incomeLineFor(pos)).toEqual({ show: true, label: '5% APY' });
  });

  it('hides for CASH without APR', () => {
    expect(incomeLineFor(cashPos([undefined]))).toEqual({
      show: false,
      label: '',
    });
  });

  it('shows APY + maturity for DEPOSIT TERM_DEPOSIT', () => {
    const pos = depositPos([
      { kind: 'TERM_DEPOSIT', apr: 7, maturityDate: '2027-12-31' },
    ]);
    const line = incomeLineFor(pos);
    expect(line.show).toBe(true);
    expect(line.label).toBe('7% APY · matures Dec 2027');
  });

  it('always hides for REAL_ESTATE', () => {
    expect(incomeLineFor(realEstatePos())).toEqual({ show: false, label: '' });
  });

  it('hides when multi-holding CRYPTO has mixed lockMeta', () => {
    // cold-wallet (no lockMeta) + earn (STAKING) — can't aggregate.
    const pos = cryptoPos([
      undefined,
      { kind: 'STAKING', apr: 5, lockPeriod: '30-day lock' },
    ]);
    expect(incomeLineFor(pos)).toEqual({ show: false, label: '' });
  });

  it('shows aggregate when multi-holding has identical lockMeta', () => {
    const pos = cryptoPos([
      { kind: 'FLEXIBLE', apr: 4 },
      { kind: 'FLEXIBLE', apr: 4 },
    ]);
    expect(incomeLineFor(pos)).toEqual({ show: true, label: '4% APR' });
  });
});

// ---- Fixtures ----

function stockPos(meta: { dividendYield?: number }): IPosition {
  return position(AssetClass.STOCK, { kind: AssetClass.STOCK, exchange: 'NASDAQ', currency: 'USD', ...meta });
}

function etfPos(meta: { dividendYield?: number }): IPosition {
  return position(AssetClass.ETF, { kind: AssetClass.ETF, exchange: 'NASDAQ', currency: 'USD', ...meta });
}

function tokenizedPos(): IPosition {
  return position(AssetClass.TOKENIZED_STOCK, {
    kind: AssetClass.TOKENIZED_STOCK,
    underlyingSymbol: 'AAPL',
    tokenSymbol: 'AAPL.X',
    exchange: 'Bybit',
    blockchain: 'Ethereum',
  });
}

function cryptoPos(locks: ReadonlyArray<IHoldingLockMeta | undefined>): IPosition {
  return position(
    AssetClass.CRYPTO,
    { kind: AssetClass.CRYPTO, coinId: 'bitcoin' },
    locks,
  );
}

function cashPos(locks: ReadonlyArray<IHoldingLockMeta | undefined>): IPosition {
  return position(
    AssetClass.CASH,
    { kind: AssetClass.CASH, currency: 'USD' },
    locks,
  );
}

function depositPos(locks: ReadonlyArray<IHoldingLockMeta | undefined>): IPosition {
  return position(
    AssetClass.DEPOSIT,
    { kind: AssetClass.DEPOSIT, currency: 'USD', interestRate: 0.07 },
    locks,
  );
}

function realEstatePos(): IPosition {
  return position(AssetClass.REAL_ESTATE, {
    kind: AssetClass.REAL_ESTATE,
    currency: 'USD',
  });
}

function position(
  assetClass: AssetClass,
  metadata: IInstrument['metadata'],
  locks: ReadonlyArray<IHoldingLockMeta | undefined> = [undefined],
): IPosition {
  const instrument: IInstrument = {
    id: `id-${assetClass}`,
    assetClass,
    symbol: assetClass,
    name: `${assetClass} instrument`,
    currency: 'USD',
    metadata,
    createdBy: 'user',
    createdAt: '2026-01-01T00:00:00.000Z',
  };
  const holdings: IHoldingView[] = locks.map((lockMeta, i) => ({
    id: `h${i}`,
    instrumentId: instrument.id,
    accountKind: 'MANUAL',
    quantity: 1,
    averageBuyPrice: 100,
    currency: 'USD',
    tagIds: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    instrument,
    tags: [],
    ...(lockMeta ? { lockMeta } : {}),
  }));
  return {
    instrument,
    holdings,
    holdingValues: holdings.map(() => 100),
    totalQuantity: holdings.length,
    totalValue: 100 * holdings.length,
    totalCostBasis: 100 * holdings.length,
    weightedAvgPrice: 100,
    paperPnL: 0,
    paperPnLPct: 0,
    tags: [],
  };
}
