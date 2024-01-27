import { createFeatureSelector, createSelector } from "@ngrx/store";
import { ISavingsState } from "./asset.reducer";


export const assetsListFeatureSelector = createFeatureSelector<ISavingsState>('assets');

export const assetsListHistorySelector = createSelector(assetsListFeatureSelector,
    state => state.assetsList)
    