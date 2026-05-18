import { AssetClass } from '../../../../../domain/asset-class.domain';
import { IHoldingView } from '../../../../../domain/holding.domain';
import { IPosition } from '../../../../../domain/position.domain';

/** Output of {@link incomeLineFor} — drives the row-3 right slot of `pgz-position-card`. */
export interface IncomeLine {
  /** Render the row-3 right slot? When false the slot is hidden entirely. */
  show: boolean;
  /** Display text — e.g. "3.0% yield", "5% APR · 30-day lock". Empty when `show=false`. */
  label: string;
}

const HIDDEN: IncomeLine = { show: false, label: '' };

/**
 * Source of truth for what appears in `pgz-position-card` row-3 right
 * slot. Pure: same input always produces same output, no HTTP, no state.
 *
 * <p>Per-class policy:
 * <ul>
 *   <li>STOCK / ETF — "{Y}% yield" if `metadata.dividendYield > 0`, else hide</li>
 *   <li>TOKENIZED_STOCK — always hide (dividends are rare/inconsistent on token wrappers)</li>
 *   <li>CRYPTO — show APR row when ALL holdings carry the same yield-bearing
 *       `lockMeta` (STAKING / FLEXIBLE). Mixed accountKinds (cold + earn +
 *       spot) → hide because we can't honestly aggregate to one APR.</li>
 *   <li>CASH — show APY when ALL holdings have FLEXIBLE lockMeta with APR</li>
 *   <li>DEPOSIT — show APY (+ "matures {Mon YYYY}" for TERM_DEPOSIT) when uniform</li>
 *   <li>REAL_ESTATE / OTHER — always hide</li>
 * </ul>
 *
 * Multi-holding rule: if per-holding labels differ across the Position,
 * we hide rather than pick one. The expanded per-Account rows still
 * surface the APR chip individually, so no information is lost.
 */
export function incomeLineFor(pos: IPosition): IncomeLine {
  const instr = pos.instrument;
  if (!instr) {
    return HIDDEN;
  }

  switch (instr.assetClass) {
    case AssetClass.STOCK:
    case AssetClass.ETF:
      return stockYield(instr.metadata);

    case AssetClass.TOKENIZED_STOCK:
    case AssetClass.REAL_ESTATE:
    case AssetClass.OTHER:
      return HIDDEN;

    case AssetClass.CRYPTO:
      return uniformLabel(pos.holdings, cryptoLabel);

    case AssetClass.CASH:
      return uniformLabel(pos.holdings, cashLabel);

    case AssetClass.DEPOSIT:
      return uniformLabel(pos.holdings, depositLabel);
  }
}

// ---- Per-class label producers (return '' when nothing to show) ----

function stockYield(meta: { dividendYield?: number } | unknown): IncomeLine {
  if (
    meta &&
    typeof meta === 'object' &&
    'dividendYield' in meta &&
    typeof (meta as { dividendYield?: unknown }).dividendYield === 'number'
  ) {
    const y = (meta as { dividendYield: number }).dividendYield;
    if (y > 0) {
      // dividendYield is a fraction (0.025 = 2.5%) — convert to percent.
      return { show: true, label: `${(y * 100).toFixed(1)}% yield` };
    }
  }
  return HIDDEN;
}

function cryptoLabel(h: IHoldingView): string {
  const meta = h.lockMeta;
  if (!meta) {
    return '';
  }
  switch (meta.kind) {
    case 'STAKING': {
      if (!meta.apr) {
        return '';
      }
      const period = meta.lockPeriod;
      return period ? `${meta.apr}% APR · ${period}` : `${meta.apr}% APR`;
    }
    case 'FLEXIBLE':
      return meta.apr ? `${meta.apr}% APR` : '';
    case 'TERM_DEPOSIT':
      // Unusual for crypto, but be defensive.
      return meta.apr ? `${meta.apr}% APR` : '';
  }
}

function cashLabel(h: IHoldingView): string {
  const meta = h.lockMeta;
  if (!meta || meta.kind !== 'FLEXIBLE' || !meta.apr) {
    return '';
  }
  return `${meta.apr}% APY`;
}

function depositLabel(h: IHoldingView): string {
  const meta = h.lockMeta;
  if (!meta) {
    return '';
  }
  switch (meta.kind) {
    case 'TERM_DEPOSIT': {
      if (!meta.apr) {
        return '';
      }
      const date = new Date(meta.maturityDate);
      if (Number.isNaN(date.getTime())) {
        return `${meta.apr}% APY`;
      }
      const ym = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
      });
      return `${meta.apr}% APY · matures ${ym}`;
    }
    case 'FLEXIBLE':
      return meta.apr ? `${meta.apr}% APY` : '';
    case 'STAKING':
      // Unusual for deposit but treat the same as flexible.
      return meta.apr ? `${meta.apr}% APY` : '';
  }
}

/**
 * Reduce per-holding labels to a single position-level label. Hides the
 * row when any holding produces a different (or empty) label — the
 * expanded per-Account rows still surface their individual APR chips.
 */
function uniformLabel(
  holdings: ReadonlyArray<IHoldingView>,
  perHolding: (h: IHoldingView) => string,
): IncomeLine {
  if (holdings.length === 0) {
    return HIDDEN;
  }
  const first = perHolding(holdings[0]);
  if (!first) {
    return HIDDEN;
  }
  for (let i = 1; i < holdings.length; i++) {
    if (perHolding(holdings[i]) !== first) {
      return HIDDEN;
    }
  }
  return { show: true, label: first };
}
