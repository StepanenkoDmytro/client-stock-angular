import { createAction } from "@ngrx/store";
import { IAsset } from "../domain/savings.domain";


export const addAsset = 
    createAction(
        '[ASSET] Add Asset', 
        (payload: { asset: IAsset }) => ({ payload })
    );