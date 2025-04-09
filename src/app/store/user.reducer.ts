import { createReducer, on } from "@ngrx/store";
import { IUser, UserMode } from "../model/User";

import { loadUser, logout, saveUser } from "./user.actions";


export interface IUserState {
    idIncrement: number,
    user: IUser
}

const initialUser: IUser = {
    id: 0,
    email: '',
    portfolioID: null,
    mode: UserMode.Stage
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
    on(saveUser, (state, action) => {
        return {
            ...state,
            idIncrement: state.idIncrement + 1,
            user: {
                ...action.payload.user
            },
        };
    }),
    on(logout, () => {
        return { ...initialUserState };
    })
);
