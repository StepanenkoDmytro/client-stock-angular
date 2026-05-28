import { AssetClass } from '../../../domain/asset-class.domain';
import { IPosition } from '../../../domain/position.domain';

/**
 * Performance-section pure aggregations (mockup §07). Frontend-only —
 * everything here is derived from the locally-available `IPosition[]`
 * (built by `PositionsService` from holdings + live/cost prices), so it
 * works for anonymous users with no backend (ADR-0012).
 *
 * Currency: a Position carries native-currency amounts (its
 * `instrument.currency`). The caller passes a {@link ToBase} converter
 * (wrapping `FxRateService.toBase`) so every money figure here lands in
 * the user's baseCurrency. Ratios (P&L %) are currency-independent and
 * pass through untouched.
 */

/** Convert a native amount into baseCurrency. Mirrors `FxRateService.toBase`. */
export type ToBase = (amount: number, fromCurrency: string | null | undefined) => number;

// ---- Gain by source (donut + legend) ----

export interface GainSourceSegment {
  assetClass: AssetClass;
  label: string;
  /** Theme CSS var, e.g. `var(--asset-crypto)` — resolved in the template. */
  colorVar: string;
  /** Net gain for this class in baseCurrency (positive subset only here). */
  gain: number;
  /** Share of the positive-gain total (0..1). */
  share: number;
}

export interface GainBySource {
  /** Net total gain across all classes (Σ paperPnL), baseCurrency. */
  totalGain: number;
  /** Sum of only the positive-gain classes — the donut's 100%. */
  positiveTotal: number;
  /** Positive-gain classes, sorted by gain desc, with share of positiveTotal. */
  segments: GainSourceSegment[];
  /** True when at least one class is net-positive (donut renderable). */
  hasGains: boolean;
}

/**
 * Group positions by AssetClass and sum their paper P&L (in base). The
 * donut answers "where did my gains come from", so it shows only the
 * classes that are net-positive; a class that's underwater is a drag, not
 * a source, and gets omitted (you can't draw a negative arc). The centre
 * still reports the NET total gain so the user sees the honest bottom line.
 */
export function computeGainBySource(
  positions: ReadonlyArray<IPosition>,
  toBase: ToBase,
): GainBySource {
  const byClass = new Map<AssetClass, number>();
  let totalGain = 0;
  for (const p of positions) {
    if (!p.instrument) continue;
    const gain = toBase(p.paperPnL, p.instrument.currency);
    if (!Number.isFinite(gain)) continue;
    byClass.set(
      p.instrument.assetClass,
      (byClass.get(p.instrument.assetClass) ?? 0) + gain,
    );
    totalGain += gain;
  }

  const positives = [...byClass.entries()].filter(([, gain]) => gain > 0);
  const positiveTotal = positives.reduce((sum, [, gain]) => sum + gain, 0);

  const segments: GainSourceSegment[] = positives
    .map(([assetClass, gain]) => ({
      assetClass,
      label: assetClassLabel(assetClass),
      colorVar: assetClassColorVar(assetClass),
      gain,
      share: positiveTotal > 0 ? gain / positiveTotal : 0,
    }))
    .sort((a, b) => b.gain - a.gain);

  return {
    totalGain,
    positiveTotal,
    segments,
    hasGains: segments.length > 0,
  };
}

// ---- Top movers (best / worst) ----

export interface TopMover {
  symbol: string;
  name: string;
  /** P&L fraction: 0.34 = +34%. Currency-independent. */
  pct: number;
  /** P&L amount in baseCurrency. */
  amount: number;
}

export interface TopMovers {
  best: TopMover | null;
  worst: TopMover | null;
}

/**
 * Best and worst position by lifetime P&L %. Only positions with a real
 * cost basis (> 0) qualify — a zero-cost position (e.g. cash) has an
 * undefined return and would skew the ranking. `worst` is null when there
 * is only one ranked position (best === worst makes no sense to show twice).
 */
export function computeTopMovers(
  positions: ReadonlyArray<IPosition>,
  toBase: ToBase,
): TopMovers {
  const ranked = positions.filter(
    (p) => p.instrument && p.totalCostBasis > 0,
  );
  if (ranked.length === 0) {
    return { best: null, worst: null };
  }
  const sorted = [...ranked].sort((a, b) => b.paperPnLPct - a.paperPnLPct);
  const toMover = (p: IPosition): TopMover => ({
    symbol: p.instrument.symbol,
    name: p.instrument.name,
    pct: p.paperPnLPct,
    amount: toBase(p.paperPnL, p.instrument.currency),
  });
  return {
    best: toMover(sorted[0]),
    worst: sorted.length > 1 ? toMover(sorted[sorted.length - 1]) : null,
  };
}

// ---- AssetClass display helpers (shared within stats) ----

export function assetClassLabel(ac: AssetClass): string {
  switch (ac) {
    case AssetClass.STOCK:
      return 'Stock';
    case AssetClass.ETF:
      return 'ETF';
    case AssetClass.TOKENIZED_STOCK:
      return 'Tokenized stock';
    case AssetClass.CRYPTO:
      return 'Crypto';
    case AssetClass.CASH:
      return 'Cash';
    case AssetClass.DEPOSIT:
      return 'Deposit';
    case AssetClass.REAL_ESTATE:
      return 'Real estate';
    case AssetClass.OTHER:
      return 'Other';
  }
}

/** Theme-aware AssetClass colour as a CSS custom-property reference. */
export function assetClassColorVar(ac: AssetClass): string {
  switch (ac) {
    case AssetClass.STOCK:
      return 'var(--asset-stock)';
    case AssetClass.ETF:
      return 'var(--asset-etf, var(--asset-stock))';
    case AssetClass.TOKENIZED_STOCK:
      return 'var(--asset-tokenized-stock)';
    case AssetClass.CRYPTO:
      return 'var(--asset-crypto)';
    case AssetClass.CASH:
      return 'var(--asset-cash)';
    case AssetClass.DEPOSIT:
      return 'var(--asset-deposit)';
    case AssetClass.REAL_ESTATE:
      return 'var(--asset-real-estate)';
    case AssetClass.OTHER:
      return 'var(--asset-other)';
  }
}
