import { ILiability } from '../../../domain/liability.domain';

/**
 * Net-worth aggregation (ADR-0009 · plan L2). Frontend-only, anonymous-safe.
 *
 * `netWorth = assetsTotal − Σ liabilities` (all in the user's base
 * currency). Liabilities are deliberately kept OUT of the asset-allocation
 * breakdown — they only reduce the headline total. This protects the class
 * pie (no "Real estate 140% / Debt −36%") and matches ADR-0009.
 */

/** Convert a native amount into base currency. Mirrors `FxRateService.toBase`. */
export type ToBase = (amount: number, fromCurrency: string | null | undefined) => number;

export interface NetWorthBreakdown {
  /** Gross portfolio value (assets only), base currency. */
  assetsTotal: number;
  /** Sum of outstanding liability balances, base currency. */
  liabilitiesTotal: number;
  /** assetsTotal − liabilitiesTotal. */
  netWorth: number;
  /** True when there's any debt — drives "show net worth headline" (L3). */
  hasDebt: boolean;
}

export function computeNetWorth(
  assetsTotal: number,
  liabilities: ReadonlyArray<ILiability>,
  toBase: ToBase,
): NetWorthBreakdown {
  const liabilitiesTotal = liabilities.reduce((sum, l) => {
    const balance = toBase(l.principalBalance ?? 0, l.currency);
    // Guard against negatives / NaN — a liability never adds to net worth.
    return sum + (Number.isFinite(balance) && balance > 0 ? balance : 0);
  }, 0);

  return {
    assetsTotal,
    liabilitiesTotal,
    netWorth: assetsTotal - liabilitiesTotal,
    hasDebt: liabilitiesTotal > 0,
  };
}

/**
 * Payoff progress for a term debt (plan L5): fraction of the original
 * amount already repaid. `0..1`. Returns 0 when `originalAmount` is missing
 * or non-positive (revolving debts have no meaningful payoff ratio).
 */
export function debtPayoffProgress(
  originalAmount: number,
  principalBalance: number,
): number {
  if (!originalAmount || originalAmount <= 0) return 0;
  const repaid = originalAmount - Math.max(0, principalBalance);
  return Math.min(1, Math.max(0, repaid / originalAmount));
}
