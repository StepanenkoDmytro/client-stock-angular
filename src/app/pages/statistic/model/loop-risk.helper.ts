import {
  ILoopPosition,
  LoopRiskTone,
  loopDisplayName,
  loopEquity,
  loopEquityNow,
  loopHealthFactor,
  loopLiquidationBuffer,
  loopLiquidationPayout,
  loopNetApy,
  loopRiskTone,
} from '../../../domain/loop-position.domain';
import { ToBase } from './performance-stats.helper';

/**
 * Strategies-risk SUMMARY aggregation (mockup `design/savings/18`). One pure,
 * O(n) pass over the user's loops producing the portfolio-wide risk picture
 * that replaces the per-loop gauge-card stack in Statistics · Risk
 * (`docs/notes/2026-05-loop-risk-summary-task.md`, LP12).
 *
 * Frontend-only / anonymous-safe (ADR-0012): every per-loop figure comes from
 * the pure `loop-position.domain` helpers; money legs are FX-normalised into
 * the user's base currency via the injected {@link ToBase} (mirrors the
 * volatility / performance helpers), so cross-currency loops sum correctly.
 * Ratios (health factor, net APY %, buffer %) are currency-free and pass
 * through unconverted.
 *
 * Posture is driven by the WEAKEST health factor, never an average — the
 * riskiest loop is the one that liquidates first, so it sets the tone.
 */

/** One ranked loop row (weakest-first list + by-protocol grouping source). */
export interface LoopRiskRow {
  id?: number;
  /** Display name, e.g. "JLP / USDC loop". */
  name: string;
  protocol: string;
  collateralAsset: string;
  debtAsset: string;
  /** Raw health factor (Infinity when debt-free). */
  healthFactor: number;
  /** Tone band derived from {@link healthFactor}. */
  tone: LoopRiskTone;
  /** Collateral-drop buffer to HF=1, positive percent (display "−X%"). */
  bufferPercent: number;
  /** Net APY percent (equity-levered, can be negative). */
  netApy: number;
  /** Equity now (incl. accrued), base currency. */
  equity: number;
}

/** Counterparty (protocol) equity share — segmented bar + legend. */
export interface ProtocolShare {
  protocol: string;
  /** Equity now on this protocol, base currency. */
  equity: number;
  /** equity / totalEquity, 0..1. */
  share: number;
}

export interface LoopRiskSummary {
  loopCount: number;
  /** Σ equityNow, base currency — the "$X equity" hero + allocation contribution. */
  totalEquity: number;
  /** Σ debt leg, base currency. */
  totalBorrowed: number;
  /** Σ collateral leg, base currency. */
  totalCollateral: number;
  /**
   * Blended leverage = Σcollateral / Σ(base equity). Uses the snapshot equity
   * (collateral − debt), NOT equityNow, to mirror the per-loop
   * `loopLeverage` definition and match the "2.8× blended leverage" header in
   * `design/savings/18` (equityNow would read ~2.7×). Leverage is a structural
   * ratio of the legs; accrued profit doesn't change how levered you are.
   */
  blendedLeverage: number;
  /** Equity-weighted net APY (Σ netApy_i·equityNow_i / Σ equityNow_i), percent. */
  weightedNetApy: number;
  /** min(HF) across loops — the weak link (Infinity when all debt-free). */
  lowestHealthFactor: number;
  /** Posture = tone of the weakest loop, never an average. */
  postureTone: LoopRiskTone;
  /** Smallest buffer across loops, positive percent (most at-risk loop). */
  worstBufferPercent: number;
  /** Σ liquidation payout (the crumb kept if all force-closed), base currency. */
  totalLiquidationPayout: number;
  /** totalLiquidationPayout / totalEquity, 0..1 (warn sliver of the bar). */
  keptPct: number;
  /** 1 − keptPct, 0..1 ("X% of equity gone on forced liquidation"). */
  lostPct: number;
  /** Loops sorted weakest-first (health factor ascending). */
  rows: LoopRiskRow[];
  /** Equity grouped by protocol, sorted by equity desc. */
  byProtocol: ProtocolShare[];
  hasData: boolean;
}

const EMPTY: LoopRiskSummary = {
  loopCount: 0,
  totalEquity: 0,
  totalBorrowed: 0,
  totalCollateral: 0,
  blendedLeverage: 0,
  weightedNetApy: 0,
  lowestHealthFactor: Number.POSITIVE_INFINITY,
  postureTone: 'green',
  worstBufferPercent: 0,
  totalLiquidationPayout: 0,
  keptPct: 0,
  lostPct: 0,
  rows: [],
  byProtocol: [],
  hasData: false,
};

/**
 * Aggregate the risk picture across all loops. `toBase` converts a loop's
 * `currency` amount into the user's base currency; pass an identity function
 * in tests. `asOf` controls accrued-profit / equityNow (defaults to now).
 */
export function computeLoopRiskSummary(
  loops: ReadonlyArray<ILoopPosition>,
  toBase: ToBase,
  asOf: Date = new Date(),
): LoopRiskSummary {
  if (!loops || loops.length === 0) return EMPTY;

  let totalEquity = 0; // Σ equityNow (base)
  let totalBaseEquity = 0; // Σ (collateral − debt) (base) — leverage denominator
  let totalBorrowed = 0;
  let totalCollateral = 0;
  let totalPayout = 0;
  let apyWeightedNumer = 0; // Σ netApy_i · equityNow_i
  let lowestHealthFactor = Number.POSITIVE_INFINITY;
  let worstBufferPercent = Number.POSITIVE_INFINITY;

  const rows: LoopRiskRow[] = [];
  const protocolEquity = new Map<string, number>();

  for (const loop of loops) {
    const cur = loop.currency;
    const equityNow = toBase(loopEquityNow(loop, asOf), cur);
    const baseEquity = toBase(loopEquity(loop), cur);
    const hf = loopHealthFactor(loop); // ratio — currency-free
    const netApy = loopNetApy(loop); // percent — currency-free
    const bufferPercent = loopLiquidationBuffer(loop) * 100; // currency-free

    totalEquity += equityNow;
    totalBaseEquity += baseEquity;
    totalBorrowed += toBase(loop.totalDebt ?? 0, cur);
    totalCollateral += toBase(loop.totalCollateral ?? 0, cur);
    totalPayout += toBase(loopLiquidationPayout(loop), cur);
    apyWeightedNumer += netApy * equityNow;
    if (hf < lowestHealthFactor) lowestHealthFactor = hf;
    if (bufferPercent < worstBufferPercent) worstBufferPercent = bufferPercent;

    protocolEquity.set(
      loop.protocol,
      (protocolEquity.get(loop.protocol) ?? 0) + equityNow,
    );

    rows.push({
      id: loop.id,
      name: loopDisplayName(loop),
      protocol: loop.protocol,
      collateralAsset: loop.collateralAsset,
      debtAsset: loop.debtAsset,
      healthFactor: hf,
      tone: loopRiskTone(hf),
      bufferPercent,
      netApy,
      equity: equityNow,
    });
  }

  // Weakest first — the weak link sits on top.
  rows.sort((a, b) => a.healthFactor - b.healthFactor);

  const byProtocol: ProtocolShare[] = [...protocolEquity.entries()]
    .map(([protocol, equity]) => ({
      protocol,
      equity,
      share: totalEquity > 0 ? equity / totalEquity : 0,
    }))
    .sort((a, b) => b.equity - a.equity);

  const keptPct = totalEquity > 0 ? totalPayout / totalEquity : 0;

  return {
    loopCount: loops.length,
    totalEquity,
    totalBorrowed,
    totalCollateral,
    blendedLeverage: totalBaseEquity > 0 ? totalCollateral / totalBaseEquity : 0,
    weightedNetApy: totalEquity > 0 ? apyWeightedNumer / totalEquity : 0,
    lowestHealthFactor,
    postureTone: loopRiskTone(lowestHealthFactor),
    worstBufferPercent: Number.isFinite(worstBufferPercent) ? worstBufferPercent : 0,
    totalLiquidationPayout: totalPayout,
    keptPct,
    lostPct: Math.max(0, 1 - keptPct),
    rows,
    byProtocol,
    hasData: true,
  };
}

/** Posture chip copy per tone (design/savings/18 — "Watch" for amber). */
export function loopPostureLabel(tone: LoopRiskTone): string {
  switch (tone) {
    case 'green':
      return 'Healthy';
    case 'amber':
      return 'Watch';
    case 'red':
      return 'At risk';
    case 'liquidated':
      return 'Liquidated';
  }
}
