/**
 * ILiability — a debt the user owes (ADR-0009). Frontend-first: persisted
 * via the localStorage `LiabilitiesService` so it works anonymously
 * (ADR-0012), exactly like `IGoal` / `GoalsService`. Backend `Liability`
 * persistence is a later sync quality-upgrade (plan Block L · L9), not a
 * blocker.
 *
 * A liability only ever *reduces* net worth — it is deliberately excluded
 * from the asset allocation breakdown (no "Real estate 140% / Debt −36%").
 */

export type LiabilityType =
  | 'MORTGAGE'
  | 'CREDIT_CARD'
  | 'PERSONAL_LOAN'
  | 'AUTO_LOAN'
  | 'STUDENT_LOAN'
  | 'MARGIN_LOAN'
  | 'BNPL'
  | 'OTHER';

export type RateType = 'FIXED' | 'VARIABLE';

export interface ILiability {
  id?: number;
  type: LiabilityType;
  /** Current outstanding balance (what you still owe). */
  principalBalance: number;
  /** Original borrowed amount — basis for payoff progress. */
  originalAmount: number;
  /** ISO 4217 currency the debt is denominated in. */
  currency: string;
  /** Annual interest rate as a percent (e.g. 5.5 = 5.5%). */
  interestRate: number;
  rateType: RateType;
  /** ISO-8601 date the debt started. */
  startDate?: string;
  /** ISO-8601 payoff / maturity date (term debts only). */
  endDate?: string;
  /**
   * Holding this debt is secured against (e.g. mortgage → the property
   * holding). Drives collateral-nesting + "Equity = value − debt" on the
   * Savings cards (plan L4).
   */
  collateralHoldingId?: string;
  lender?: string;
  notes?: string;
  /** Local-first sync flag (mirrors IHolding/IGoal). `false` = local-only. */
  isSaved?: boolean;
  /** `true` for opt-in demo rows — cleared by DemoDataService.clear(). */
  isDemo?: boolean;
}

/**
 * Revolving debts (credit card, BNPL, margin) have no fixed payoff date,
 * so they get no debt-payoff goal / freedom-date marker (plan L5). Term
 * debts (mortgage, auto, student, personal) do.
 */
export function isRevolvingLiability(type: LiabilityType): boolean {
  return type === 'CREDIT_CARD' || type === 'BNPL' || type === 'MARGIN_LOAN';
}

/** Human-readable label per liability type. */
const LIABILITY_TYPE_LABELS: Readonly<Record<LiabilityType, string>> = {
  MORTGAGE: 'Mortgage',
  CREDIT_CARD: 'Credit card',
  PERSONAL_LOAN: 'Personal loan',
  AUTO_LOAN: 'Auto loan',
  STUDENT_LOAN: 'Student loan',
  MARGIN_LOAN: 'Margin loan',
  BNPL: 'Buy now, pay later',
  OTHER: 'Loan',
};

export function liabilityTypeLabel(type: LiabilityType): string {
  return LIABILITY_TYPE_LABELS[type] ?? 'Loan';
}
