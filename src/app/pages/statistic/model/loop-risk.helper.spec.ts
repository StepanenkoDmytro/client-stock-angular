import { ILoopPosition } from '../../../domain/loop-position.domain';
import {
  computeLoopRiskSummary,
  loopPostureLabel,
} from './loop-risk.helper';

/** Identity converter — all test loops are in the base currency. */
const identity = (amount: number, _cur: string | null | undefined): number => amount;

/** Fixed clock; loops open on the same day → zero accrual → equityNow = equity. */
const ASOF = new Date('2026-05-29T00:00:00Z');
const OPENED = '2026-05-29';

function loop(p: Partial<ILoopPosition>): ILoopPosition {
  return {
    protocol: 'Aave v3',
    collateralAsset: 'X',
    debtAsset: 'Y',
    openedAt: OPENED,
    totalCollateral: 0,
    totalDebt: 0,
    currency: 'USD',
    initialCapital: 0,
    supplyApy: 0,
    borrowApy: 0,
    liquidationThreshold: 80,
    liquidationPenalty: 5,
    ...p,
  };
}

// Worked-example loop (savings/16): equity 3000, HF 1.20, netApy +37%, buffer 16.67%.
const JLP = loop({
  protocol: 'Kamino',
  collateralAsset: 'JLP',
  debtAsset: 'USDC',
  totalCollateral: 9000,
  totalDebt: 6000,
  supplyApy: 15,
  borrowApy: 4,
  liquidationThreshold: 80,
  liquidationPenalty: 5,
  initialCapital: 3000,
});

// Safer stable loop: equity 3500, HF 1.83, netApy +9%, buffer 45.36%.
const USDE = loop({
  protocol: 'Morpho',
  collateralAsset: 'USDe',
  debtAsset: 'USDC',
  totalCollateral: 7000,
  totalDebt: 3500,
  supplyApy: 8,
  borrowApy: 7,
  liquidationThreshold: 91.5,
  liquidationPenalty: 5,
  initialCapital: 3500,
});

describe('computeLoopRiskSummary', () => {
  it('returns an empty, hasData=false summary for no loops', () => {
    const s = computeLoopRiskSummary([], identity, ASOF);
    expect(s.hasData).toBeFalse();
    expect(s.loopCount).toBe(0);
    expect(s.rows).toEqual([]);
  });

  it('aggregates totals across loops (base-currency sums)', () => {
    const s = computeLoopRiskSummary([JLP, USDE], identity, ASOF);
    expect(s.loopCount).toBe(2);
    expect(s.totalEquity).toBeCloseTo(6500, 5); // 3000 + 3500, no accrual
    expect(s.totalCollateral).toBe(16000); // 9000 + 7000
    expect(s.totalBorrowed).toBe(9500); // 6000 + 3500
  });

  it('blended leverage = Σcollateral / Σ(base equity), not equityNow', () => {
    const s = computeLoopRiskSummary([JLP, USDE], identity, ASOF);
    expect(s.blendedLeverage).toBeCloseTo(16000 / 6500, 4); // ≈ 2.46×
  });

  it('weights net APY by equity (not a plain average)', () => {
    const s = computeLoopRiskSummary([JLP, USDE], identity, ASOF);
    // (37×3000 + 9×3500) / 6500
    expect(s.weightedNetApy).toBeCloseTo((37 * 3000 + 9 * 3500) / 6500, 3);
  });

  it('posture follows the WEAKEST health factor, never the average', () => {
    const s = computeLoopRiskSummary([JLP, USDE], identity, ASOF);
    expect(s.lowestHealthFactor).toBeCloseTo(1.2, 4); // JLP, not (1.2+1.83)/2
    expect(s.postureTone).toBe('amber');
    expect(loopPostureLabel(s.postureTone)).toBe('Watch');
  });

  it('reports the worst (smallest) buffer', () => {
    const s = computeLoopRiskSummary([JLP, USDE], identity, ASOF);
    expect(s.worstBufferPercent).toBeCloseTo(16.667, 2); // JLP's buffer
  });

  it('sums the forced-liquidation payout and derives kept/lost share', () => {
    const s = computeLoopRiskSummary([JLP, USDE], identity, ASOF);
    // JLP: 6000/0.8 − 6000×1.05 = 7500 − 6300 = 1200
    // USDe: 3500/0.915 − 3500×1.05 = 3825.14 − 3675 = 150.14
    expect(s.totalLiquidationPayout).toBeCloseTo(1350.14, 1);
    expect(s.keptPct).toBeCloseTo(1350.14 / 6500, 3);
    expect(s.lostPct).toBeCloseTo(1 - 1350.14 / 6500, 3);
  });

  it('orders rows weakest-first (health factor ascending)', () => {
    const s = computeLoopRiskSummary([USDE, JLP], identity, ASOF); // input order reversed
    expect(s.rows.map((r) => r.collateralAsset)).toEqual(['JLP', 'USDe']);
    expect(s.rows[0].healthFactor).toBeLessThan(s.rows[1].healthFactor);
  });

  it('groups equity by protocol, sorted by equity desc', () => {
    const s = computeLoopRiskSummary([JLP, USDE], identity, ASOF);
    expect(s.byProtocol.map((p) => p.protocol)).toEqual(['Morpho', 'Kamino']);
    expect(s.byProtocol[0].share).toBeCloseTo(3500 / 6500, 4);
    expect(s.byProtocol[1].share).toBeCloseTo(3000 / 6500, 4);
  });

  it('handles a single loop (valid one-row summary)', () => {
    const s = computeLoopRiskSummary([JLP], identity, ASOF);
    expect(s.loopCount).toBe(1);
    expect(s.rows.length).toBe(1);
    expect(s.postureTone).toBe('amber');
    expect(s.byProtocol.length).toBe(1);
    expect(s.byProtocol[0].share).toBeCloseTo(1, 5);
  });

  it('handles an underwater loop (equityNow ≤ 0) without NaN/blow-ups', () => {
    // debt > collateral → equity −1000, HF 0.67 (liquidated), buffer −50%.
    const underwater = loop({
      protocol: 'Aave v3',
      collateralAsset: 'X',
      debtAsset: 'Y',
      totalCollateral: 5000,
      totalDebt: 6000,
      supplyApy: 10,
      borrowApy: 5,
      liquidationThreshold: 80,
      liquidationPenalty: 5,
      initialCapital: 2000,
    });
    const s = computeLoopRiskSummary([underwater], identity, ASOF);

    expect(s.hasData).toBeTrue();
    expect(s.loopCount).toBe(1);
    expect(s.totalEquity).toBeCloseTo(-1000, 5);
    // Guards: non-positive equity → leverage / weighted APY / kept all fall to 0.
    expect(s.blendedLeverage).toBe(0);
    expect(s.weightedNetApy).toBe(0);
    expect(s.keptPct).toBe(0);
    expect(s.lostPct).toBe(1);
    // Risk readings still computed from the legs.
    expect(s.postureTone).toBe('liquidated');
    expect(s.lowestHealthFactor).toBeCloseTo(0.6667, 3);
    expect(s.worstBufferPercent).toBeCloseTo(-50, 3);
    expect(s.rows[0].tone).toBe('liquidated');
    // Nothing NaN/Infinity leaked into the headline numbers.
    [s.totalEquity, s.blendedLeverage, s.weightedNetApy, s.keptPct, s.lostPct,
      s.worstBufferPercent, s.totalLiquidationPayout].forEach((n) =>
      expect(Number.isFinite(n)).toBeTrue(),
    );
  });

  it('handles a debt-free loop (zero debt → HF ∞, nothing to liquidate)', () => {
    const debtFree = loop({
      protocol: 'Lido',
      collateralAsset: 'wstETH',
      debtAsset: '—',
      totalCollateral: 4000,
      totalDebt: 0,
      supplyApy: 10,
      borrowApy: 0,
      liquidationThreshold: 80,
      initialCapital: 4000,
    });
    const s = computeLoopRiskSummary([debtFree], identity, ASOF);

    expect(s.loopCount).toBe(1);
    expect(s.totalBorrowed).toBe(0);
    expect(Number.isFinite(s.lowestHealthFactor)).toBeFalse(); // HF = Infinity
    expect(s.postureTone).toBe('green');
    expect(s.blendedLeverage).toBeCloseTo(1, 5); // 4000 / 4000
    expect(s.weightedNetApy).toBeCloseTo(10, 3); // supply only, no borrow drag
    expect(s.worstBufferPercent).toBeCloseTo(100, 3);
    // No debt → liquidation payout = full equity → you keep everything.
    expect(s.keptPct).toBeCloseTo(1, 5);
    expect(s.lostPct).toBeCloseTo(0, 5);
    expect(s.rows[0].tone).toBe('green');
  });

  it('applies FX conversion to money legs but not to ratios', () => {
    // 2× converter: equity/borrowed/collateral double; HF & APY unchanged.
    const twoX = (amount: number) => amount * 2;
    const s = computeLoopRiskSummary([JLP], twoX, ASOF);
    expect(s.totalEquity).toBeCloseTo(6000, 5); // 3000 × 2
    expect(s.totalCollateral).toBe(18000); // 9000 × 2
    expect(s.lowestHealthFactor).toBeCloseTo(1.2, 4); // ratio, unchanged
    expect(s.weightedNetApy).toBeCloseTo(37, 3); // percent, unchanged
    expect(s.blendedLeverage).toBeCloseTo(3, 4); // 18000/6000 = ratio preserved
  });
});
