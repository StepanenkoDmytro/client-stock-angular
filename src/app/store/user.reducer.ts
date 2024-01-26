import { createReducer, on } from "@ngrx/store";
import { IUSer } from "../model/User";
import { addSpending, deleteSpending, editSpending, loadSpending } from "./spendings.actions";


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
    on(addSpending, (state, action) => {
      return {
        ...state,
        idIncrement: state.idIncrement + 1,
        user: {
          ...state.user,
          spendingsHistory: [...state.user.spendingsHistory, action.payload.spending],
        },
      };
    }),
    on(editSpending, (state, action) => {
      const updatedSpendingsHistory = state.user.spendingsHistory.map(spending => {
        
        if (spending.id === action.payload.spending.id) {
          return action.payload.spending;
        }
        return spending;
      });
    
      return {
        ...state,
        user: {
          ...state.user,
          spendingsHistory: updatedSpendingsHistory,
        },
      };
    }),
    on(deleteSpending, (state, action) => {
      const updatedSpendingsHistory = state.user.spendingsHistory.filter(
        spending => spending.id !== action.payload.id
      );
    
      return {
        ...state,
        user: {
          ...state.user,
          spendingsHistory: updatedSpendingsHistory,
        },
      };
    }),    
    on(loadSpending, (state, action) => ({
      ...action.payload.state
    })
    )
);

