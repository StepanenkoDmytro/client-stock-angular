import { createAction } from "@ngrx/store";
import { IAsset } from "../../../domain/savings.domain";
import { ISavingsState } from "./asset.reducer";


export const addAsset = 
    createAction(
        '[ASSET] Add Asset', 
        (payload: { asset: IAsset }) => ({ payload })
    );

export const editAsset = 
    createAction(
        '[ASSET] Edit Asset', 
        (payload: { asset: IAsset }) => ({ payload })
    );

export const loadSavings = 
    createAction(
        '[ASSET] Load Savings', 
        (payload: { state: ISavingsState }) => ({ payload })
    );

export const deleteAsset = 
    createAction(
        '[ASSET] Delete Asset', 
        (payload: { symbol: string }) => ({ payload })
    );
    