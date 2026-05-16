import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AssetClass } from '../../../domain/asset-class.domain';
import { IHolding, IHoldingView } from '../../../domain/holding.domain';
import { IInstrument } from '../../../domain/instrument.domain';
import { ITag } from '../../../domain/tag.domain';
import { selectTagsList } from './tags.selectors';
import { IHoldingsState } from './holdings.reducer';

export const selectHoldingsState =
  createFeatureSelector<IHoldingsState>('holdings');

export const selectHoldingsList = createSelector(
  selectHoldingsState,
  (state) => state?.holdingsList ?? [],
);

export const selectHoldingById = (id: string) =>
  createSelector(selectHoldingsList, (list) => list.find((h) => h.id === id));

export const selectHoldingsByAssetClass = (
  assetClass: AssetClass,
  instruments: Map<string, IInstrument>,
) =>
  createSelector(selectHoldingsList, (list) =>
    list.filter(
      (h) => instruments.get(h.instrumentId)?.assetClass === assetClass,
    ),
  );

export const selectHoldingsByTag = (tagId: string) =>
  createSelector(selectHoldingsList, (list) =>
    list.filter((h) => h.tagIds.includes(tagId)),
  );

/**
 * Joined projection used by UI: each `IHolding` enriched with its full
 * `IInstrument` and resolved `ITag[]`. Pure factory — pass the current
 * snapshot of instruments (from `InstrumentService.instruments` signal)
 * and tags are joined from the tags store.
 *
 * Holdings whose instrumentId doesn't resolve are dropped — protects UI
 * from rendering a holding with a missing instrument (shouldn't happen
 * with correct migration, but defensive).
 */
export const selectHoldingsView = (instruments: Map<string, IInstrument>) =>
  createSelector(
    selectHoldingsList,
    selectTagsList,
    (holdings, tags): IHoldingView[] => {
      const tagsById = new Map(tags.map((t: ITag) => [t.id, t]));
      const result: IHoldingView[] = [];
      for (const h of holdings as IHolding[]) {
        const instrument = instruments.get(h.instrumentId);
        if (!instrument) {
          continue;
        }
        const resolvedTags = h.tagIds
          .map((id) => tagsById.get(id))
          .filter((t): t is ITag => !!t);
        result.push({
          ...h,
          instrument,
          tags: resolvedTags,
        });
      }
      return result;
    },
  );
