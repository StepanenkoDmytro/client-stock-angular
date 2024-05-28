import { createReducer, on } from "@ngrx/store";
import { addSpending, editSpending, deleteSpending, loadSpending, addMultipleSpendings, deleteSpendingWithoutApiCall, addCategory, loadCategories, resetCategories } from "./spendings.actions";
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
  categorySpendings: Category.getCategoryDefaultList(),
};

const addCategoryToParent = (categories: Category[], newCategory: Category): Category[] => {

  return categories.map(category => {
    if (!newCategory.parent) {
      const updatedCategory = category.id === newCategory.id 
        ? updateCategoryChildren(newCategory, category.children)
        : category;

      return updatedCategory;
    } 

    if(category.id === newCategory.parent) {
      const existingChildIndex = category.children.findIndex(child => child.id === newCategory.id);
            
      if(existingChildIndex === -1) {
        return updateCategoryChildren(category, [...category.children, newCategory]);
      }
      const existingCategory = category.children[existingChildIndex];
      newCategory = updateCategoryChildren(newCategory, existingCategory.children);
      const updatedChildren = category.children
        .map((child, index) => index === existingChildIndex ? newCategory : child);
      
      return updateCategoryChildren(category, updatedChildren);
    } 

    if (category.children.length > 0) {
      const updatedChildren = addCategoryToParent(category.children, newCategory);
      return updateCategoryChildren(category, updatedChildren);
    } 

    return category;
  });
}

const updateCategoryChildren = ( category: Category, children: Category[]): Category => {
  return {
    ...category,
    children
  } as Category;
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
    const category = action.payload.category;
    const newCategorySpendingsState: Category[] = addCategoryToParent(state.categorySpendings, category);

    return {
        ...state,
        idIncrement: state.idIncrement + 1,
        categorySpendings: newCategorySpendingsState,
    };
  }),
  on(loadCategories, (state, action) => {
    return {
      ...action.payload.state
    }
  }),
  on(resetCategories, (state, action) => {

    return {
      ...state,
      idIncrement: state.idIncrement + 1,
      categorySpendings: action.payload.categorySpendings
    }
  }),

  /* Logout */
  on(logout, () => {
    return { ...initialSpendingsState };
  })
);
