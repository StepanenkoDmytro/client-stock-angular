import { AssetClass } from '../../../domain/asset-class.domain';
import { IPosition } from '../../../domain/position.domain';
import { ToBase, assetClassLabel } from './performance-stats.helper';

/**
 * Volatility-profile aggregation (mockup §08). Frontend-only — classifies
 * each position into a coarse risk tier by AssetClass (+ stablecoin
 * override for crypto) and sums portfolio value per tier. No prices feed
 * beyond what `PositionsService` already resolved, so it works offline /
 * anonymous (ADR-0012).
 *
 * This is a structural risk proxy, NOT statistical volatility (we have no
 * price history). The copy in the UI frames it as such ("typically").
 */

export type VolTier = 'low' | 'medium' | 'high';

/**
 * Stablecoins are pegged, so they sit in the Low tier even though their
 * AssetClass is CRYPTO. Kept as a small set (extend as needed) — the
 * common USD-pegged majors. Matches stats plan A7.
 */
const STABLECOIN_SYMBOLS: ReadonlySet<string> = new Set([
  'USDT', 'USDC', 'DAI', 'BUSD', 'TUSD', 'USDP', 'GUSD', 'FDUSD', 'USDD',
]);

/**
 * Coarse risk tier for an instrument. AssetClass-driven with a stablecoin
 * override for crypto. Cash/deposits = Low; equities & real estate &
 * "other" = Medium; volatile crypto = High; pegged crypto = Low.
 */
export function volatilityTierFor(
  assetClass: AssetClass,
  symbol: string | undefined,
): VolTier {
  switch (assetClass) {
    case AssetClass.CASH:
    case AssetClass.DEPOSIT:
      return 'low';
    case AssetClass.STOCK:
    case AssetClass.ETF:
    case AssetClass.TOKENIZED_STOCK:
    case AssetClass.REAL_ESTATE:
    case AssetClass.OTHER:
      return 'medium';
    case AssetClass.CRYPTO:
      return STABLECOIN_SYMBOLS.has((symbol ?? '').toUpperCase())
        ? 'low'
        : 'high';
  }
}

export interface VolClassRow {
  assetClass: AssetClass;
  label: string;
  /** Class value in baseCurrency. */
  value: number;
  /** Class value / portfolio total (0..1). */
  share: number;
  /** 'Low' | 'Medium' | 'High' | 'Mixed'. */
  tierLabel: string;
  /** Per-tier fractions WITHIN the class (sum to 1) — drives the split bar. */
  lowFraction: number;
  mediumFraction: number;
  highFraction: number;
}

export interface VolatilityProfile {
  total: number;
  /** Value per tier, baseCurrency. */
  low: number;
  medium: number;
  high: number;
  /** Tier value / total (0..1). */
  lowShare: number;
  mediumShare: number;
  highShare: number;
  /** Per-class rows, sorted by value desc. */
  classes: VolClassRow[];
  hasData: boolean;
}

interface ClassAcc {
  total: number;
  low: number;
  medium: number;
  high: number;
}

const TIER_NAME: Record<VolTier, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

/**
 * Bucket positions into risk tiers (overall donut) and per-class rows. A
 * class that spans more than one tier (e.g. crypto with stablecoins +
 * volatile coins) is labelled "Mixed" and carries the per-tier split for
 * the bar.
 */
export function computeVolatilityProfile(
  positions: ReadonlyArray<IPosition>,
  toBase: ToBase,
): VolatilityProfile {
  const classAcc = new Map<AssetClass, ClassAcc>();
  let total = 0;
  let low = 0;
  let medium = 0;
  let high = 0;

  for (const p of positions) {
    if (!p.instrument) continue;
    const value = toBase(p.totalValue, p.instrument.currency);
    if (!Number.isFinite(value) || value <= 0) continue;

    const tier = volatilityTierFor(p.instrument.assetClass, p.instrument.symbol);
    total += value;
    if (tier === 'low') low += value;
    else if (tier === 'medium') medium += value;
    else high += value;

    const acc = classAcc.get(p.instrument.assetClass) ?? {
      total: 0,
      low: 0,
      medium: 0,
      high: 0,
    };
    acc.total += value;
    acc[tier] += value;
    classAcc.set(p.instrument.assetClass, acc);
  }

  if (total <= 0) {
    return {
      total: 0,
      low: 0,
      medium: 0,
      high: 0,
      lowShare: 0,
      mediumShare: 0,
      highShare: 0,
      classes: [],
      hasData: false,
    };
  }

  const classes: VolClassRow[] = [...classAcc.entries()]
    .map(([assetClass, a]) => {
      const presentTiers = (['low', 'medium', 'high'] as VolTier[]).filter(
        (t) => a[t] > 0,
      );
      const tierLabel =
        presentTiers.length > 1 ? 'Mixed' : TIER_NAME[presentTiers[0]];
      return {
        assetClass,
        label: assetClassLabel(assetClass),
        value: a.total,
        share: a.total / total,
        tierLabel,
        lowFraction: a.low / a.total,
        mediumFraction: a.medium / a.total,
        highFraction: a.high / a.total,
      };
    })
    .sort((x, y) => y.value - x.value);

  return {
    total,
    low,
    medium,
    high,
    lowShare: low / total,
    mediumShare: medium / total,
    highShare: high / total,
    classes,
    hasData: true,
  };
}
