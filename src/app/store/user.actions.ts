import { createAction } from "@ngrx/store";
import { IUserState } from "./user.reducer";


export const addPortfolioID = 
    createAction(
        '[USER] Add Portfolio id', 
        (payload: { portfolioID: number }) => ({ payload })
    );

export const loadUser = 
    createAction(
        '[USER] Load User', 
        (payload: { userState: IUserState }) => ({ payload })
    );
