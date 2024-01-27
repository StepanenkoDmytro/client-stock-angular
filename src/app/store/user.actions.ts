import { createAction } from "@ngrx/store";
import { IUserState } from "./user.reducer";
import { ISavingsState } from "../pages/savings/store/asset.reducer";
import { ISpendingsState } from "../pages/spending/store/spendings.reducer";


export const updateGlobalUser = 
    createAction(
        '[User Service] Update User, Savings and Spendings states', 
        (payload: { userState: IUserState, spendingState: ISpendingsState, assetState: ISavingsState }) => ({ payload })
    );
