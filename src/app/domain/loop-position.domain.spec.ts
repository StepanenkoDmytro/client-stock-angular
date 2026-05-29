import {
  ILoopPosition,
  loopAccruedProfit,
  loopDisplayName,
  loopEquity,
  loopEquityNow,
  loopHealthFactor,
  loopLeverage,
  loopLiquidationBuffer,
  loopLiquidationPayout,
  loopLtv,
  loopNetApy,
  loopNetPnl,
  loopNetPnlPercent,
  loopRiskTone,
} from './loop-position.domain';

/**
 * Worked example — design/savings/16-looping-worked-example.svg.
 * $3,000 capital looped 3× → $9,000 collateral / $6,000 debt; stake 15% /
 * borrow 4%; liq threshold 80%; opened exactly 2 months ago.
 */
function workedExample(monthsAgo = 2): ILoopPosition {
  const opened = new Date();
  opened.setMonth(opened.getMonth() - monthsAgo);
  return {
    protocol: 'Kamino',
    chain: 'Solana',
    collateralAsset: 'JLP',
    debtAsset: 'USDC',
    openedAt: opened.toISOString(),
    totalCollateral: 9000,
    totalDebt: 6000,
    currency: 'USD',
    initialCapital: 3000,
    supplyApy: 15,
    borrowApy: 4,
    liquidationThreshold: 80,
  };
}

describe('loop-position.domain — worked example (savings/16)', () => {
  const p = workedExample();
  // Fixed "as of" exactly 2 months after open for deterministic accrual.
  const asOf = (() => {
    const d = new Date(p.openedAt);
    d.setMonth(d.getMonth() + 2);
    return d;
  })();

  it('equity = collateral − debt = $3,000', () => {
    expect(loopEquity(p)).toBe(3000);
  });

  it('leverage = collateral / equity = 3.0×', () => {
    expect(loopLeverage(p)).toBeCloseTo(3.0, 5);
  });

  it('LTV = debt / collateral = 0.667', () => {
    expect(loopLtv(p)).toBeCloseTo(6000 / 9000, 5);
  });

  it('net APY = +37% (levered spread, not the average)', () => {
    expect(loopNetApy(p)).toBeCloseTo(37, 5);
  });

  it('health factor = 1.20', () => {
    expect(loopHealthFactor(p)).toBeCloseTo(1.2, 5);
  });

  it('liquidation buffer ≈ 16.7% drop to HF=1', () => {
    expect(loopLiquidationBuffer(p)).toBeCloseTo(1 - 6000 / (9000 * 0.8), 5);
  });

  it('accrued profit over 2 months ≈ +$185', () => {
    expect(loopAccruedProfit(p, asOf)).toBeCloseTo(185, 0);
  });

  it('equity now ≈ $3,185', () => {
    expect(loopEquityNow(p, asOf)).toBeCloseTo(3185, 0);
  });

  it('net PnL ≈ +$185 (+6.2%)', () => {
    expect(loopNetPnl(p, asOf)).toBeCloseTo(185, 0);
    expect(loopNetPnlPercent(p, asOf)).toBeCloseTo(6.2, 1);
  });
});

describe('loop-position.domain — wstETH/ETH eMode (savings/12)', () => {
  const p: ILoopPosition = {
    protocol: 'Aave v3',
    chain: 'Ethereum',
    collateralAsset: 'wstETH',
    debtAsset: 'ETH',
    eMode: true,
    openedAt: new Date().toISOString(),
    totalCollateral: 30000,
    totalDebt: 20000,
    currency: 'USD',
    initialCapital: 10000,
    supplyApy: 3.9,
    borrowApy: 2.7,
    liquidationThreshold: 95,
  };

  it('equity $10,000 · leverage 3.0×', () => {
    expect(loopEquity(p)).toBe(10000);
    expect(loopLeverage(p)).toBeCloseTo(3.0, 5);
  });

  it('net APY +6.3%', () => {
    expect(loopNetApy(p)).toBeCloseTo(6.3, 5);
  });

  it('health factor 1.42', () => {
    expect(loopHealthFactor(p)).toBeCloseTo(1.425, 3);
  });

  it('buffer −30% drop before liquidation', () => {
    expect(loopLiquidationBuffer(p)).toBeCloseTo(0.298, 2);
  });

  it('liquidation payout ≈ $850 (eMode 1% penalty)', () => {
    // 20000/0.95 − 20000×1.01 = 21052.6 − 20200 ≈ 852.6
    expect(loopLiquidationPayout(p)).toBeCloseTo(853, 0);
  });
});

describe('loop-position.domain — edge cases & tone', () => {
  it('negative net APY when borrow outweighs levered supply', () => {
    const p = {
      ...workedExample(),
      supplyApy: 2,
      borrowApy: 5,
    };
    expect(loopNetApy(p)).toBeLessThan(0);
  });

  it('zero debt → no liquidation risk (HF Infinity), leverage 1.0×', () => {
    const p: ILoopPosition = { ...workedExample(), totalDebt: 0, totalCollateral: 3000 };
    expect(loopHealthFactor(p)).toBe(Number.POSITIVE_INFINITY);
    expect(loopLeverage(p)).toBeCloseTo(1.0, 5);
  });

  it('equity ≤ 0 guards (leverage / netApy / HF return safe 0)', () => {
    const p: ILoopPosition = { ...workedExample(), totalCollateral: 6000, totalDebt: 6000 };
    expect(loopEquity(p)).toBe(0);
    expect(loopLeverage(p)).toBe(0);
    expect(loopNetApy(p)).toBe(0);
  });

  it('risk tone bands', () => {
    expect(loopRiskTone(0.95)).toBe('liquidated');
    expect(loopRiskTone(1.1)).toBe('red');
    expect(loopRiskTone(1.2)).toBe('amber');
    expect(loopRiskTone(1.42)).toBe('amber');
    expect(loopRiskTone(2.1)).toBe('green');
  });

  it('display name falls back to "<coll> / <debt> loop"', () => {
    expect(loopDisplayName(workedExample())).toBe('JLP / USDC loop');
    expect(loopDisplayName({ ...workedExample(), name: 'My loop' })).toBe('My loop');
  });
});
