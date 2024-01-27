import { createSelector } from "@ngrx/store";
import { userFeatureSelector } from "./user.selectors";


export const assetsListSelector = createSelector(userFeatureSelector,
    state => state.user.assetsList)