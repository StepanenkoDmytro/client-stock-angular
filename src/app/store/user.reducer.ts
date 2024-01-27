import { createReducer, on } from "@ngrx/store";
import { IUSer } from "../model/User";
import { addSpending, deleteSpending, editSpending } from "../pages/spending/store/spendings.actions";

import { addAsset, deleteAsset, editAsset } from "../pages/savings/store/assets.actions";


export interface IUserState {
    idIncrement: number,
    user: IUSer
}

const initialUser: IUSer = {
    // spendingsHistory: [],
    // assetsList: [],
}

const initialUserState: IUserState = {
    idIncrement: 0,
    user: initialUser
}

export const userReducer = createReducer(
    initialUserState,
    //User reducers
    // on(loadUser, (state, action) => ({
    //   ...action.payload.state
    // })),
);
