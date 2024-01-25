import { createReducer, on } from "@ngrx/store";
import { IUSer } from "../model/User";
import { addSpending } from "./spendings.actions";


export interface IUserState {
    idIncrement: number,
    user: IUSer
}

const initialUser: IUSer = {
    spendingsHistory: [],
}

const initialUserState: IUserState = {
    idIncrement: 0,
    user: initialUser
}

export const userReducer = createReducer(
    initialUserState,
    on(addSpending, (state, action) => ({
        ...state,
        idIncrement: state.idIncrement + 1,
        user: {
          ...state.user,
          spendingsHistory: [
            ...state.user.spendingsHistory,
            action.payload.spending
          ]
        }
      })),
);

