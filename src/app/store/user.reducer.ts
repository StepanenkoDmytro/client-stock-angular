import { createReducer, on } from "@ngrx/store";
import { IUSer } from "../model/User";
import { addSpending, deleteSpending, editSpending } from "./spendings.actions";
import { loadUser } from "./user.actions";
import { addAsset, deleteAsset, editAsset } from "./assets.actions";


export interface IUserState {
    idIncrement: number,
    user: IUSer
}

const initialUser: IUSer = {
    spendingsHistory: [],
    assetsList: [],
}

const initialUserState: IUserState = {
    idIncrement: 0,
    user: initialUser
}

export const userReducer = createReducer(
    initialUserState,

    //User reducers
    on(loadUser, (state, action) => ({
      ...action.payload.state
    })),

    //Spendings reducers
    on(addSpending, (state, action) => {
      return {
        ...state,
        idIncrement: state.idIncrement + 1,
        user: {
          ...state.user,
          spendingsHistory: [...state.user.spendingsHistory, action.payload.spending],
        },
      };
    }),
    on(editSpending, (state, action) => {
      const updatedSpendingsHistory = state.user.spendingsHistory.map(spending => {
        
        if (spending.id === action.payload.spending.id) {
          return action.payload.spending;
        }
        return spending;
      });
    
      return {
        ...state,
        user: {
          ...state.user,
          spendingsHistory: updatedSpendingsHistory,
        },
      };
    }),
    on(deleteSpending, (state, action) => {
      const updatedSpendingsHistory = state.user.spendingsHistory.filter(
        spending => spending.id !== action.payload.id
      );
    
      return {
        ...state,
        user: {
          ...state.user,
          spendingsHistory: updatedSpendingsHistory,
        },
      };
    }),  

    //Savings reducers
    on(addAsset, (state, action) => {
      const updatedAssetsList = Array.isArray(state.user.assetsList) ? state.user.assetsList : [];
      return {
        ...state,
        idIncrement: state.idIncrement + 1,
        user: {
          ...state.user,
          assetsList: [...updatedAssetsList, action.payload.asset],
        },
      };
    }),
    
    on(editAsset, (state, action) => {
    
      const existingAsset = state.user.assetsList.find(asset => asset.symbol === action.payload.asset.symbol)
      const newAsset = action.payload.asset;
      
      const existingCost = existingAsset.buyPrice * existingAsset.count;
      const addAssetCost = newAsset.price * newAsset.count;

      const sumOfCost = existingCost + addAssetCost;
      const sumOfCount = existingAsset.count + newAsset.count;
    
      const avgPrice = sumOfCost / sumOfCount;

      existingAsset.buyPrice = avgPrice;
      existingAsset.count = sumOfCount;

      const updatedAssetList = state.user.assetsList.map(asset => {
        
        if (asset.symbol === existingAsset.symbol) {
          return existingAsset;
        }
        return asset;
      });

      return {
        ...state,
        user: {
          ...state.user,
          assetsList: updatedAssetList,
        }
      };
    }),
    on(deleteAsset, (state, action) => {
      const updatedAssetList = state.user.assetsList.filter(
        asset => asset.symbol !== action.payload.symbol
      );
    
      return {
        ...state,
        user: {
          ...state.user,
          assetsList: updatedAssetList,
        },
      };
    })
);

