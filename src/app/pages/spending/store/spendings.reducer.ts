import { createReducer, on } from "@ngrx/store";
import { addSpending, editSpending, deleteSpending, loadSpending, addMultipleSpendings, deleteSpendingWithoutApiCall, addCategory } from "./spendings.actions";
import { Spending } from "../model/Spending";
import { logout } from "../../../store/user.actions";
import { Category } from "../../../domain/category.domain";


export interface ISpendingsState {
  idIncrement: number,
  spendingsHistory: Spending[];
  categorySpendings: Category[];
}

const initialSpendingsState: ISpendingsState = {
  idIncrement: 0,
  spendingsHistory: [],
  categorySpendings: Category.defaultList as Category[],
};

const addCategoryToParent = (categories: Category[], newCategory: Category, parentId: string): Category[] => {
  return categories.map(category => {
    if(category.id === parentId) {
      const updatedChildren = category.children.length > 0 ? [...category.children, newCategory] : [newCategory];
      const updatedCategory = {
        ...category,
        children: updatedChildren
      };
      return updatedCategory as Category;
    } else if (category.children.length > 0) {
      const updatedChildren = addCategoryToParent(category.children, newCategory, parentId);
      const updatedCategory = {
        ...category,
        children: updatedChildren
      };
      return updatedCategory as Category;
    } else {
      return category;
    }
  });
}

export const spendingsReducer = createReducer(
  initialSpendingsState,

   /* Spendings */
  on(addSpending, (state, action) => {
    const newSpending = action.payload.spending;
    const isExist = state.spendingsHistory.find(spending => spending.id === newSpending.id);
    if(!isExist) {
      return {
          ...state,
          idIncrement: state.idIncrement + 1,
          spendingsHistory: [...state.spendingsHistory, action.payload.spending],
      };
    }
    return state;
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
  on(addMultipleSpendings, (state, action) => {
    return {
        ...state,
        idIncrement: state.idIncrement + action.payload.spendings.length,
        spendingsHistory: [...state.spendingsHistory, ...action.payload.spendings],
    };
  }),
  on(loadSpending, (state, action) => {
    return {
      ...action.payload.state
    }
  }),
  on(deleteSpending, (state, action) => {
    const updatedSpendingsHistory = state.spendingsHistory.filter(
      spending => spending.id !== action.payload.id
    );
  
    return {
        ...state,
        spendingsHistory: updatedSpendingsHistory,
    };
  }),  
  on(deleteSpendingWithoutApiCall, (state, action) => {
    const updatedSpendingsHistory = state.spendingsHistory.filter(
      spending => spending.id !== action.payload.id
    );
  
    return {
        ...state,
        spendingsHistory: updatedSpendingsHistory,
    };
  }), 

  /* Categories */
  on(addCategory, (state, action) => {
    const newcategorySpendingsState: Category[] = addCategoryToParent(state.categorySpendings, action.payload.category, action.payload.parentId);
    
    return {
        ...state,
        idIncrement: state.idIncrement + 1,
        categorySpendings: newcategorySpendingsState,
    };
  }),

  /* Logout */
  on(logout, () => {
    return { ...initialSpendingsState };
  })
);
