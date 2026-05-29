/**
 * ILoopPosition — a DeFi leverage loop (ADR-0013 composite kind · domain
 * reference `docs/instruments/looping.md`). A loop deposits a collateral
 * asset, borrows against it, swaps back into more collateral and repeats —
 * so one position carries BOTH an asset leg and a debt leg plus leverage.
 *
 * Frontend-first, anonymous-safe: persisted via the localStorage
 * `LoopingService` exactly like `IGoal`/`ILiability` (ADR-0012). Net APY and
 * accrued profit are computed client-side from `openedAt` — no backend, no
 * login. Backend sync is a later quality-upgrade, not a blocker.
 *
 * Net-worth contract (ADR-0013): a loop contributes its **equity**
 * (collateral − debt) as a single "Strategies" allocation slice. Gross
 * collateral is NOT added to the crypto pie and the borrow leg is NOT added
 * to the Liabilities band — both legs are internal to the loop, so leverage
 * never inflates allocation.
 *
 * Read-only: we surface health / liquidation buffer but never execute,
 * borrow or rebalance.
 */

/**
 * Money amounts (`totalCollateral`, `totalDebt`, `initialCapital`) are
 * stored in `currency` and FX-normalised into the user's base currency for
 * display via `FxRateService.toBase`, mirroring `ILiability`. For a crypto
 * loop the user typically enters USD-equivalent values, so `currency`
 * defaults to the base currency.
 */
export interface ILoopPosition {
  id?: number;

  // ---- Identity ----
  /** Protocol label, e.g. "Aave v3", "Morpho", "Kamino". */
  protocol: string;
  /** Chain label, e.g. "Ethereum", "Solana", "Arbitrum". */
  chain?: string;
  /** Collateral (supply) asset symbol, e.g. "wstETH", "JLP". */
  collateralAsset: string;
  /** Borrowed (debt) asset symbol, e.g. "ETH", "USDC". */
  debtAsset: string;
  /** Correlated/eMode position (higher max LTV, lower liq penalty). */
  eMode?: boolean;
  /** Number of re-pledge rounds — informational only. */
  loopRounds?: number;
  /** ISO-8601 date the loop was opened — basis for accrued profit / PnL. */
  openedAt: string;
  /** Optional display override; otherwise derived "<coll> / <debt> loop". */
  name?: string;

  // ---- Size (stored snapshot of the two legs) ----
  /** Total collateral / exposure (in `currency`). */
  totalCollateral: number;
  /** Total borrowed / debt (in `currency`). */
  totalDebt: number;
  /** ISO 4217 currency the amounts are denominated in. */
  currency: string;
  /** Capital the user actually put in — basis for net PnL. */
  initialCapital: number;

  // ---- Yield (annual percents, e.g. 15 = 15%) ----
  /** Supply / staking APY on the collateral leg. */
  supplyApy: number;
  /** Borrow APY (cost) on the debt leg. */
  borrowApy: number;
  /** Extra reward-token APR, if any (informational). */
  rewardsApr?: number;

  // ---- Risk (protocol params, percents) ----
  /** Liquidation threshold (LLTV), e.g. 80 = 80%. eMode raises it. */
  liquidationThreshold: number;
  /** Max LTV allowed on entry (informational), percent. */
  maxLtv?: number;
  /**
   * Liquidation penalty percent ( liquidator bonus). Defaults to ~1% for
   * eMode and ~5% otherwise when omitted — see {@link loopLiquidationPenalty}.
   */
  liquidationPenalty?: number;

  // ---- Meta ----
  notes?: string;
  /** Local-first sync flag (mirrors IHolding/IGoal/ILiability). */
  isSaved?: boolean;
  /** `true` for opt-in demo rows — cleared by DemoDataService.clear(). */
  isDemo?: boolean;
}

/** Health-factor tone bands. `liquidated` = HF < 1 (already force-closed). */
export type LoopRiskTone = 'green' | 'amber' | 'red' | 'liquidated';

/**
 * How a risk reading was produced — forward-compat hook so a future
 * measured/scored model (per `docs/notes/2026-05-risk-metrics-calculation-
 * task.md`) and the current rule-based bands can coexist and the UI can
 * label estimates honestly. A loop's health factor is computed from the
 * real legs, so loop tone is always `'measured'`; the flag exists for the
 * eventual shared `RiskAssessment` contract (ADR-0013 risk forward-compat,
 * `2026-05-add-loop-instrument-task.md` §7).
 */
export type LoopRiskMethod = 'measured' | 'heuristic';

/**
 * HF tone band thresholds — the SINGLE source of truth so a later swap to a
 * finer classification / scoring model touches only this table, not the call
 * sites ("risk tier = derived, not stored"). Green ≥ `safe` (1.8), amber ≥
 * `red` (1.2), red ≥ `liquidated` (1.0), liquidated below 1.0. Matches the
 * gauge in `design/savings/12` and the dots on `14`/`15`/`16` (HF 1.20 →
 * amber "watch", 1.42 → amber, 2.1 → green).
 */
export const LOOP_HF_TONE_THRESHOLDS = {
  /** Below this HF the position is already force-closed. */
  liquidated: 1.0,
  /** [liquidated, red) → red (near liquidation). */
  red: 1.2,
  /** [red, safe) → amber (watch); ≥ safe → green. */
  safe: 1.8,
} as const;

/** @deprecated read {@link LOOP_HF_TONE_THRESHOLDS}.safe — kept as an alias. */
export const LOOP_HF_GREEN_MIN = LOOP_HF_TONE_THRESHOLDS.safe;
/** @deprecated read {@link LOOP_HF_TONE_THRESHOLDS}.red — kept as an alias. */
export const LOOP_HF_AMBER_MIN = LOOP_HF_TONE_THRESHOLDS.red;

/** Default liquidation penalty fraction by mode (eMode positions are gentler). */
const LOOP_PENALTY_EMODE = 0.01;
const LOOP_PENALTY_VOLATILE = 0.05;

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

/** Net equity = collateral − debt (the loop's net-worth contribution snapshot). */
export function loopEquity(p: ILoopPosition): number {
  return (p.totalCollateral ?? 0) - (p.totalDebt ?? 0);
}

/** Leverage = collateral / equity (e.g. 3.0×). Guards equity ≤ 0 → 0. */
export function loopLeverage(p: ILoopPosition): number {
  const equity = loopEquity(p);
  if (equity <= 0) return 0;
  return (p.totalCollateral ?? 0) / equity;
}

/** Loan-to-value as a fraction 0..1 (debt / collateral). */
export function loopLtv(p: ILoopPosition): number {
  const coll = p.totalCollateral ?? 0;
  if (coll <= 0) return 0;
  return (p.totalDebt ?? 0) / coll;
}

/**
 * Net APY as a percent — NOT the average of the two rates. Yield accrues on
 * the whole collateral (×leverage of capital), interest is paid on the debt,
 * and we divide by the user's own equity:
 *   `netApy% = (supplyApy×collateral − borrowApy×debt) / equity`.
 * Can be negative when the borrow cost outweighs the levered supply yield.
 * Worked example (savings/16): (15×9000 − 4×6000)/3000 = +37%.
 */
export function loopNetApy(p: ILoopPosition): number {
  const equity = loopEquity(p);
  if (equity <= 0) return 0;
  const supply = (p.supplyApy ?? 0) * (p.totalCollateral ?? 0);
  const borrow = (p.borrowApy ?? 0) * (p.totalDebt ?? 0);
  return (supply - borrow) / equity;
}

/**
 * Health factor = (collateral × liqThreshold) / debt; `< 1` ⇒ liquidation.
 * Worked example: 9000×0.80/6000 = 1.20. Zero debt → no liquidation risk
 * (returns Infinity-safe large number capped for display by the caller).
 */
export function loopHealthFactor(p: ILoopPosition): number {
  const debt = p.totalDebt ?? 0;
  const thr = (p.liquidationThreshold ?? 0) / 100;
  if (debt <= 0) return Number.POSITIVE_INFINITY;
  return ((p.totalCollateral ?? 0) * thr) / debt;
}

/**
 * Liquidation buffer as a positive fraction: how far the collateral can drop
 * (relative to the debt) before HF hits 1. Display prepends "−" ("−30% to
 * liquidation"). `buffer = 1 − debt / (collateral × liqThreshold)`.
 */
export function loopLiquidationBuffer(p: ILoopPosition): number {
  const thr = (p.liquidationThreshold ?? 0) / 100;
  const denom = (p.totalCollateral ?? 0) * thr;
  if (denom <= 0) return 0;
  return 1 - (p.totalDebt ?? 0) / denom;
}

/** Effective liquidation penalty fraction (explicit, else eMode-derived default). */
export function loopLiquidationPenalty(p: ILoopPosition): number {
  if (p.liquidationPenalty != null) return p.liquidationPenalty / 100;
  return p.eMode ? LOOP_PENALTY_EMODE : LOOP_PENALTY_VOLATILE;
}

/**
 * Residual after a forced liquidation NOW (in `currency`):
 *   `payout = collateralAtTrigger − debt × (1 + penalty)`,
 * where `collateralAtTrigger = debt / liqThreshold`. The threshold cushion is
 * mostly eaten by the liquidator penalty, so this is a crumb compared with a
 * voluntary exit (≈ current equity) — the core risk message. Clamped at 0
 * (a negative payout is protocol bad debt, not money owed back to the user).
 */
export function loopLiquidationPayout(p: ILoopPosition): number {
  const thr = (p.liquidationThreshold ?? 0) / 100;
  const debt = p.totalDebt ?? 0;
  if (thr <= 0 || debt <= 0) return loopEquity(p);
  const collateralAtTrigger = debt / thr;
  const payout = collateralAtTrigger - debt * (1 + loopLiquidationPenalty(p));
  return Math.max(0, payout);
}

/** Whole years elapsed since `openedAt` (fractional), clamped at 0. */
function yearsHeld(p: ILoopPosition, asOf: Date): number {
  const opened = new Date(p.openedAt).getTime();
  if (!Number.isFinite(opened)) return 0;
  return Math.max(0, (asOf.getTime() - opened) / MS_PER_YEAR);
}

/**
 * Profit accrued since `openedAt` (in `currency`), time-based:
 *   `accrued = netApyFraction × equity × yearsHeld`.
 * Anonymous-first: the legs are a static snapshot, so we estimate growth on
 * the client from the open date (savings/16). Worked example: 0.37 × 3000 ×
 * (2/12) ≈ +$185.
 */
export function loopAccruedProfit(p: ILoopPosition, asOf: Date = new Date()): number {
  return (loopNetApy(p) / 100) * loopEquity(p) * yearsHeld(p, asOf);
}

/**
 * Current equity including accrued profit (the net-worth contribution shown
 * as "Equity now"): `equity + accruedProfit`. Worked example ≈ $3,185.
 */
export function loopEquityNow(p: ILoopPosition, asOf: Date = new Date()): number {
  return loopEquity(p) + loopAccruedProfit(p, asOf);
}

/** Net PnL since start (in `currency`): `equityNow − initialCapital`. */
export function loopNetPnl(p: ILoopPosition, asOf: Date = new Date()): number {
  return loopEquityNow(p, asOf) - (p.initialCapital ?? 0);
}

/** Net PnL as a percent of initial capital, 0 when capital is missing. */
export function loopNetPnlPercent(p: ILoopPosition, asOf: Date = new Date()): number {
  const capital = p.initialCapital ?? 0;
  if (capital <= 0) return 0;
  return (loopNetPnl(p, asOf) / capital) * 100;
}

/**
 * Health-factor tone band (drives the dot / gauge colour). Derived from
 * {@link LOOP_HF_TONE_THRESHOLDS} — never store the band, store the raw HF
 * and re-derive, so a future scoring model only swaps the table.
 */
export function loopRiskTone(healthFactor: number): LoopRiskTone {
  const t = LOOP_HF_TONE_THRESHOLDS;
  if (healthFactor < t.liquidated) return 'liquidated';
  if (healthFactor < t.red) return 'red';
  if (healthFactor < t.safe) return 'amber';
  return 'green';
}

/** Display name — explicit override, else "<collateral> / <debt> loop". */
export function loopDisplayName(p: ILoopPosition): string {
  if (p.name && p.name.trim().length > 0) return p.name;
  return `${p.collateralAsset} / ${p.debtAsset} loop`;
}
