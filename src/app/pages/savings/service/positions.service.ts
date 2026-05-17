import { Injectable } from '@angular/core';
import { IHoldingView } from '../../../domain/holding.domain';
import { IPosition } from '../../../domain/position.domain';
import { ITag } from '../../../domain/tag.domain';

/**
 * Resolves a "current price" for an instrument symbol. The frontend's
 * `HoldingService.getCurrentPrice()` matches this signature directly;
 * tests can pass a plain `Map.get`-like function or a hand-written stub.
 *
 * Returning `undefined` means "no live price for this symbol" — the
 * service then falls back to the holding's `averageBuyPrice` so the
 * position still reports a non-zero `totalValue` and the user sees their
 * cost basis instead of a $0 position.
 */
export type PriceFor = (symbol: string) => number | undefined;

/**
 * PositionsService — aggregates per-Instrument totals across multiple
 * `IHoldingView` entries. Pure: no store reads, no side effects, no
 * injectables. Mainly a place to keep the algorithm out of components
 * and make it independently testable.
 *
 * Inputs:
 *   - `holdings`: a flat list (whatever the caller already projected from
 *     the store — typically the full `selectHoldingsView` for Class view).
 *   - `priceFor`: lookup for current market prices; falls back to
 *     averageBuyPrice when the price is unknown.
 *
 * Output: `IPosition[]` sorted by `totalValue` desc. Within each Position,
 * `holdings` is sorted by per-holding currentValue desc so the largest
 * location renders first when the user expands the card.
 *
 * Per `docs/notes/2026-05-pr3-position-card-task.md` §4.
 */
@Injectable({ providedIn: 'root' })
export class PositionsService {
  /**
   * Groups holdings by `instrument.id`, computes per-Position totals and
   * sorts everything. Returns `[]` for empty input.
   */
  fromHoldings(
    holdings: readonly IHoldingView[],
    priceFor: PriceFor,
  ): IPosition[] {
    if (holdings.length === 0) {
      return [];
    }

    // 1. Bucket by instrumentId. Map keeps insertion order; we re-sort
    //    by totalValue at the end so order here doesn't matter.
    const buckets = new Map<string, IHoldingView[]>();
    for (const h of holdings) {
      const list = buckets.get(h.instrumentId) ?? [];
      list.push(h);
      buckets.set(h.instrumentId, list);
    }

    // 2. Aggregate each bucket → Position.
    const positions: IPosition[] = [];
    for (const list of buckets.values()) {
      positions.push(this.buildPosition(list, priceFor));
    }

    // 3. Sort positions by totalValue desc — largest position first.
    positions.sort((a, b) => b.totalValue - a.totalValue);
    return positions;
  }

  /** Build a single Position from holdings of one Instrument. Holdings
   *  inside the Position are sorted by per-holding currentValue desc. */
  private buildPosition(
    list: IHoldingView[],
    priceFor: PriceFor,
  ): IPosition {
    // Compute per-holding values first so we can sort by them.
    const valued = list.map((h) => ({
      holding: h,
      currentValue: this.currentValueOf(h, priceFor),
      costBasis: h.quantity * h.averageBuyPrice,
    }));
    valued.sort((a, b) => b.currentValue - a.currentValue);

    const holdings = valued.map((v) => v.holding);
    const holdingValues = valued.map((v) => v.currentValue);
    const totalQuantity = list.reduce((s, h) => s + h.quantity, 0);
    const totalValue = valued.reduce((s, v) => s + v.currentValue, 0);
    const totalCostBasis = valued.reduce((s, v) => s + v.costBasis, 0);
    const weightedAvgPrice =
      totalQuantity > 0 ? totalCostBasis / totalQuantity : 0;
    const paperPnL = totalValue - totalCostBasis;
    const paperPnLPct = totalCostBasis > 0 ? paperPnL / totalCostBasis : 0;

    return {
      instrument: list[0].instrument,
      holdings,
      holdingValues,
      totalQuantity,
      totalValue,
      totalCostBasis,
      weightedAvgPrice,
      paperPnL,
      paperPnLPct,
      tags: this.unionTags(list),
    };
  }

  /** Σ qty × (live price OR averageBuyPrice as fallback). */
  private currentValueOf(h: IHoldingView, priceFor: PriceFor): number {
    const live = priceFor(h.instrument.symbol);
    const price = live ?? h.averageBuyPrice;
    return h.quantity * price;
  }

  /** Deduplicated union of tags across the holdings of one Position.
   *  Tag equality is by `id` — same logical tag attached to multiple
   *  holdings collapses to one dot in the UI. */
  private unionTags(list: IHoldingView[]): ITag[] {
    const byId = new Map<string, ITag>();
    for (const h of list) {
      for (const t of h.tags) {
        if (!byId.has(t.id)) {
          byId.set(t.id, t);
        }
      }
    }
    return Array.from(byId.values());
  }
}
