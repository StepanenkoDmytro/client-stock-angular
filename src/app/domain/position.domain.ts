import { IHoldingView } from './holding.domain';
import { IInstrument } from './instrument.domain';
import { ITag } from './tag.domain';

// Re-export lock-meta shapes so consumers can import them from a single
// "position-shaped" entry point. The canonical definitions live in
// `holding.domain.ts` because `lockMeta` is a holding-level field; this
// re-export avoids the cyclic import that would result from defining it
// here and pulling it back into `holding.domain.ts`.
export type {
  IHoldingLockMeta,
  StakingLockMeta,
  TermDepositLockMeta,
  FlexibleLockMeta,
} from './holding.domain';

/**
 * IPosition — aggregate of all holdings the user has of one Instrument.
 *
 * Built on the frontend by `PositionsService.fromHoldings()`. One Position
 * per Instrument; the user may hold the same Instrument across several
 * Accounts (e.g. BTC on a cold wallet + Bybit Earn + Bybit Spot). The
 * `holdings` array is pre-sorted by per-holding `currentValue` desc so the
 * largest location renders first when the card expands.
 *
 * Stays frontend-only — the backend (M2) returns a flat `IHolding[]` and
 * we aggregate on read. Position has no ID, no persistence, no actions of
 * its own.
 *
 * Per `docs/notes/2026-05-pr3-position-card-task.md` §4.
 */
export interface IPosition {
  /** Instrument every holding in this Position belongs to. */
  instrument: IInstrument;
  /** Holdings making up the Position. Length ≥ 1, sorted by currentValue desc. */
  holdings: IHoldingView[];
  /** Per-holding current values aligned to `holdings` (qty × currentPrice). */
  holdingValues: number[];
  /** Σ holding.quantity. */
  totalQuantity: number;
  /** Σ holdingValues. In the user's base currency. */
  totalValue: number;
  /** Σ holding.quantity × holding.averageBuyPrice. */
  totalCostBasis: number;
  /** Σ(qty × avgPrice) / Σ qty. Returns 0 when totalQuantity is 0. */
  weightedAvgPrice: number;
  /** totalValue − totalCostBasis. */
  paperPnL: number;
  /** paperPnL / totalCostBasis, fraction units (0.05 = +5%). 0 when costBasis = 0. */
  paperPnLPct: number;
  /** Tags resolved at the Holding-level (deduplicated union across holdings). */
  tags: ITag[];
}
