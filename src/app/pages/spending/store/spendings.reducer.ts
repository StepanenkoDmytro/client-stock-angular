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

const addCategoryToParent = (categories: Category[], newCategory: Category, parentId: string | null): Category[] => {
  // debugger;
  return categories.map(category => {
    if (parentId === null || parentId === undefined) {
      const updatedCategory = category.id === newCategory.id 
        ?  {
          ...newCategory,
          children: category.children
        } as Category
        : category;

      return updatedCategory;
    } else if(category.id === parentId) {
      const existingChildIndex = category.children.findIndex(child => child.id === newCategory.id);
            
            let updatedChildren;
            if (existingChildIndex !== -1) {
                // Заміна існуючої категорії, зберігаючи її children
                const existingCategory = category.children[existingChildIndex];
                newCategory = {
                  ...newCategory,
                  children: existingCategory.children
                } as Category;

                updatedChildren = category.children.map((child, index) => index === existingChildIndex ? newCategory : child);
            } else {
                // Додавання нової категорії
                updatedChildren = [...category.children, newCategory];
            }
      const updatedParentCategory = {
        ...category,
        children: updatedChildren
      };
      return updatedParentCategory as Category;
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
    const category = action.payload.category;
    const parentId = action.payload.parentId;
    // category.setParent(parentId);
    
    const newCategorySpendingsState: Category[] = addCategoryToParent(state.categorySpendings, category, parentId);
    // console.log('newcategorySpendingsState', newCategorySpendingsState);
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
