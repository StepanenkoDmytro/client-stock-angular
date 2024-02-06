import { createReducer, on } from "@ngrx/store";
import { addSpending, editSpending, deleteSpending, loadSpending } from "./spendings.actions";
import { Spending } from "../model/Spending";


export interface ISpendingsState {
  idIncrement: number,
  spendingsHistory: Spending[];
}

const initialSpendingsState: ISpendingsState = {
  idIncrement: 0,
  spendingsHistory: [],
};

export const spendingsReducer = createReducer(
  initialSpendingsState,
  on(addSpending, (state, action) => {
      return {
          ...state,
          idIncrement: state.idIncrement + 1,
          spendingsHistory: [...state.spendingsHistory, action.payload.spending],
      };
  }),
  on(editSpending, (state, action) => {
    const updatedSpendingsHistory = state.spendingsHistory.map(spending => {
      
      if (spending.id === action.payload.spending.id) {
        return action.payload.spending;
      }
      return spending;
    });
  
    return {
        ...state,
        spendingsHistory: updatedSpendingsHistory,
    };
  }),
  on(loadSpending, (state, action) => ({
    ...action.payload.state
  })),
  on(deleteSpending, (state, action) => {
    const updatedSpendingsHistory = state.spendingsHistory.filter(
      spending => spending.id !== action.payload.id
    );
  
    return {
        ...state,
        spendingsHistory: updatedSpendingsHistory,
    };
  }),  
);
