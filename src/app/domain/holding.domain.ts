import { IInstrument } from './instrument.domain';
import { ITag } from './tag.domain';

/**
 * IHolding — a single position the user holds: which instrument, where it
 * lives (account), how much, at what average buy price, and how it's tagged.
 *
 * Persistence-wise, holdings live in the `holdings` NgRx feature state (added
 * in PR4) and are mirrored to localStorage under the `'holdings-list'` key.
 * Backend sync (`HoldingsEffects` + REST `/api/v1/holdings`) lands in M5.
 *
 * Average buy price is maintained by `holdings.reducer.editHolding` per
 * formula:
 *   avg = (oldQty * oldAvg + newQty * newPrice) / (oldQty + newQty)
 * This carries over the existing logic from `asset.reducer.editAsset`.
 */
export interface IHolding {
  id: string;
  instrumentId: string;
  /**
   * Account the position lives on. Optional until Account UI lands; until
   * then `HoldingService` defaults this to the literal `'manual'` to keep
   * a single bucket for everything user-entered.
   */
  accountId?: string;
  quantity: number;
  averageBuyPrice: number;
  /** ISO 4217. Usually equals `instrument.currency`. */
  currency: string;
  tagIds: string[];
  /** ISO-8601 timestamp. */
  createdAt: string;
  /** ISO-8601 timestamp. */
  updatedAt: string;
}

/**
 * IHoldingView — joined projection produced by selectors.
 *
 * The selector resolves `instrumentId` against the InstrumentService cache
 * and `tagIds` against the Tags store. Components consume this shape and
 * never reach into the raw store themselves.
 */
export interface IHoldingView extends IHolding {
  instrument: IInstrument;
  tags: ITag[];
}
