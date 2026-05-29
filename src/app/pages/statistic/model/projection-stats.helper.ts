/**
 * Forward-projection maths (mockup §09). Pure & frontend-only — compound
 * growth from the user's *current* portfolio value (P0, real) plus a
 * user-set monthly contribution. No backend, no history needed, so it
 * works anonymously (ADR-0012).
 *
 * The contribution is an explicit user input (the what-if slider), NOT an
 * auto-detected saving rate — detecting savings needs income data or
 * net-worth-delta over snapshots (Wave 2). Framed honestly in the UI.
 */

export interface ReturnScenario {
  key: 'conservative' | 'realistic' | 'optimistic';
  label: string;
  /** Annual nominal return, fraction (0.06 = 6%). */
  rate: number;
}

/** Long-term equity-return scenarios (mockup §09 / roadmap M5.7). */
export const RETURN_SCENARIOS: ReadonlyArray<ReturnScenario> = [
  { key: 'optimistic', label: 'Optimistic', rate: 0.08 },
  { key: 'realistic', label: 'Realistic', rate: 0.06 },
  { key: 'conservative', label: 'Conservative', rate: 0.04 },
];

/** Default scenario for single-number framings (hero, ETA, gap). */
export const REALISTIC_RATE = 0.06;

/**
 * Future value of `p0` after `years`, adding `monthlyContribution` at the
 * end of every month, compounded monthly at `annualRate`. Standard
 * annuity-future-value formula; handles the `rate === 0` degenerate case.
 */
export function projectFutureValue(
  p0: number,
  monthlyContribution: number,
  annualRate: number,
  years: number,
): number {
  const n = Math.round(years * 12);
  if (n <= 0) return p0;
  const i = annualRate / 12;
  if (i === 0) {
    return p0 + monthlyContribution * n;
  }
  const growth = Math.pow(1 + i, n);
  return p0 * growth + monthlyContribution * ((growth - 1) / i);
}

export interface ProjectionPoint {
  year: number;
  value: number;
}

/** Year-by-year series (0..years inclusive) for charting. */
export function buildProjectionSeries(
  p0: number,
  monthlyContribution: number,
  annualRate: number,
  years: number,
): ProjectionPoint[] {
  const points: ProjectionPoint[] = [];
  for (let y = 0; y <= years; y++) {
    points.push({
      year: y,
      value: projectFutureValue(p0, monthlyContribution, annualRate, y),
    });
  }
  return points;
}

/** Hard cap for the iterative ETA solver — 100 years. */
const MAX_MONTHS = 1200;

/**
 * Months until `p0` (+ monthly contributions, compounded) first reaches
 * `target`. `0` when already there, `null` when unreachable within
 * {@link MAX_MONTHS} (e.g. zero contribution and zero/again-negative
 * growth). Iterative — robust and avoids log-solving edge cases.
 */
export function monthsToReach(
  p0: number,
  monthlyContribution: number,
  annualRate: number,
  target: number,
): number | null {
  if (target <= 0 || p0 >= target) return 0;
  const i = annualRate / 12;
  let value = p0;
  for (let m = 1; m <= MAX_MONTHS; m++) {
    value = value * (1 + i) + monthlyContribution;
    if (value >= target) return m;
  }
  return null;
}

/**
 * Monthly contribution needed to grow `saved` to `target` within `months`
 * at `annualRate` (solve the annuity formula for the payment). `0` when
 * already on track; `null` when there's no time left (`months <= 0`).
 */
export function requiredMonthlyContribution(
  saved: number,
  target: number,
  annualRate: number,
  months: number,
): number | null {
  if (months <= 0) return null;
  const i = annualRate / 12;
  if (i === 0) {
    return Math.max(0, (target - saved) / months);
  }
  const growth = Math.pow(1 + i, months);
  const c = ((target - saved * growth) * i) / (growth - 1);
  return Math.max(0, c);
}
