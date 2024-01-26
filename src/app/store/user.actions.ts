import { createAction } from "@ngrx/store";
import { IUserState } from "./user.reducer";


export const loadUser = 
    createAction(
        '[USER] Load User', 
        (payload: { state: IUserState }) => ({ payload })
    );
