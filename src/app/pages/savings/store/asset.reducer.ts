import { createReducer, on } from "@ngrx/store";
import { IAsset } from "../../../domain/savings.domain";
import { addAsset, editAsset, deleteAsset, loadSavings } from "./assets.actions";


export interface ISavingsState {
    idIncrement: number,
    assetsList: IAsset[];
}

const initialSavingsState: ISavingsState = {
    idIncrement: 0,
    assetsList: [],
};

export const assetReducer = createReducer(
    initialSavingsState,
    on(addAsset, (state, action) => {
        const updatedAssetsList = Array.isArray(state.assetsList) ? state.assetsList : [];
        return {
            ...state,
            idIncrement: state.idIncrement + 1,
            assetsList: [...updatedAssetsList, action.payload.asset],
        };
      }),
      
      on(editAsset, (state, action) => {
      
        const existingAsset = state.assetsList.find(asset => asset.symbol === action.payload.asset.symbol)
        const newAsset = action.payload.asset;
        
        const existingCost = existingAsset.buyPrice * existingAsset.count;
        const addAssetCost = newAsset.price * newAsset.count;
  
        const sumOfCost = existingCost + addAssetCost;
        const sumOfCount = existingAsset.count + newAsset.count;
      
        const avgPrice = sumOfCost / sumOfCount;
  
        existingAsset.buyPrice = avgPrice;
        existingAsset.count = sumOfCount;
  
        const updatedAssetList = state.assetsList.map(asset => {
          
          if (asset.symbol === existingAsset.symbol) {
            return existingAsset;
          }
          return asset;
        });
  
        return {
            ...state,
            assetsList: updatedAssetList,
        };
      }),
      on(loadSavings, (state, action) => ({
        ...action.payload.state
      })),
      on(deleteAsset, (state, action) => {
        const updatedAssetList = state.assetsList.filter(
          asset => asset.symbol !== action.payload.symbol
        );
      
        return {
            ...state,
            assetsList: updatedAssetList,
        };
      })
);
