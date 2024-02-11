import { createAction } from "@ngrx/store";
import { IUserState } from "./user.reducer";
import { IUser } from "../model/User";


export const saveUser = 
    createAction(
        '[USER] Add Portfolio id', 
        (payload: { user: IUser }) => ({ payload })
    );

export const loadUser = 
    createAction(
        '[USER] Load User', 
        (payload: { userState: IUserState }) => ({ payload })
    );

export const logout = createAction('[Auth] Logout');
