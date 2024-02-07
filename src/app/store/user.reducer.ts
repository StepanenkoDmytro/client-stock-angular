import { createReducer, on } from "@ngrx/store";
import { IUSer } from "../model/User";

import { addPortfolioID, loadUser } from "./user.actions";


export interface IUserState {
    idIncrement: number,
    user: IUSer
}

const initialUser: IUSer = {
    portfolioID: null
}

const initialUserState: IUserState = {
    idIncrement: 0,
    user: initialUser
}

export const userReducer = createReducer(
    initialUserState,
    // User reducers
    on(loadUser, (state, action) => ({
      ...action.payload.userState
    })),
    on(addPortfolioID, (state, action) => {
        return {
            ...state,
            idIncrement: state.idIncrement + 1,
            user: {
                ...state.user,
                portfolioID: action.payload.portfolioID
            },
        };
    }),
);
