import { createReducer, on } from "@ngrx/store";
import { addSpending, editSpending, deleteSpending, loadSpending, addMultipleSpendings, deleteSpendingWithoutApiCall, addCategory, loadCategories } from "./spendings.actions";
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
  // console.log('addCategoryToParent' ,categories, newCategory, parentId);
  // debugger;
  return categories.map(category => {
    if (parentId === null && category.id === newCategory.id) {
      return new Category(newCategory.title, newCategory.icon, category.children, newCategory.isSaved, newCategory.id, parentId);
    } else if(category.id === parentId) {
      const existingChild = category.children.find(child => child.id === newCategory.id);

      const updatedChildren = existingChild
        ? category.children.map(child => child.id === newCategory.id ? 
          new Category(
            newCategory.title,
            newCategory.icon,
            child.children, // збереження дітей
            newCategory.isSaved,
            newCategory.id,
            newCategory.parent // збереження батьківського ID
          ) : child)
        : [...category.children, newCategory];
        
        return new Category(
          category.title,
          category.icon,
          updatedChildren, // оновлені діти
          category.isSaved,
          category.id,
          category.parent // збереження батьківського ID
        );

    } else if (category.children.length > 0) {
      const updatedChildren = addCategoryToParent(category.children, newCategory, parentId);
      return new Category(
        category.title,
        category.icon,
        updatedChildren, // оновлені діти
        category.isSaved,
        category.id,
        category.parent // збереження батьківського ID
      );
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

  /* Logout */
  on(logout, () => {
    return { ...initialSpendingsState };
  })
);
