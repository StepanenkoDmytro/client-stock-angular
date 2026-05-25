import { createReducer, on } from "@ngrx/store";
import { addSpending, editSpending, deleteSpending, loadSpending, addMultipleSpendings, deleteSpendingWithoutApiCall, addCategory, editCategory, loadCategories, resetCategories, deleteCategory } from "./spendings.actions";
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

const deleteCategoryFromParent = (categories: Category[], deletedCategory: Category): Category[] => {
  return categories.map(category => {
    if(category.id === deletedCategory.parent) {
      const existingCategoryIndex = category.children.findIndex(child => child.id === deletedCategory.id);

      if(existingCategoryIndex === -1) {
        console.error('Spendings reducer: category already deleted');
        return category;
      }
      const updatedChildren = category.children.filter(category => category.id !== deletedCategory.id);
      return updateCategoryChildren(category, updatedChildren);
    }

    if(category.children.length > 0) {
      const updatedChildren = deleteCategoryFromParent(category.children, deletedCategory);
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

/**
 * Recursively walk the tree, dropping any node with `targetId` from its
 * parent's children. Returns the original list when no removal happens,
 * a fresh list (immutable update) otherwise. Used by `editCategory` to
 * atomically lift a node from its current parent before re-inserting
 * under a new one — avoids the delete-then-add race that previously
 * caused move operations to silently drop categories.
 */
const removeCategoryFromTree = (categories: Category[], targetId: string): Category[] => {
  return categories.map(category => {
    if (category.children.length === 0) {
      return category;
    }
    const filtered = category.children.filter(child => child.id !== targetId);
    const cleanedChildren = removeCategoryFromTree(filtered, targetId);
    return updateCategoryChildren(category, cleanedChildren);
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
    const newCategorySpendingsState: Category[] = addCategoryToParent(state.categorySpendings, category);

    return {
        ...state,
        idIncrement: state.idIncrement + 1,
        categorySpendings: newCategorySpendingsState,
    };
  }),
  on(deleteCategory, (state, action) => {
    const category = action.payload.category;
    const newCategorySpendingsState: Category[] = deleteCategoryFromParent(state.categorySpendings, category);
    console.log('newCategorySpendingsState', newCategorySpendingsState);
    return {
      ...state,
      idIncrement: state.idIncrement + 1,
      categorySpendings: newCategorySpendingsState,
    };
  }),
  /**
   * Atomic edit (rename + reparent in a single dispatch). Previously the
   * UI did `deleteCategory` + `addCategory` to fake an edit, which raced
   * the two HTTP calls in `mergeMap` and could lose the row server-side.
   * Now the reducer:
   *  1. Lifts the existing category from wherever it sits in the tree.
   *  2. Inserts the updated category under its new parent (or as root
   *     replacement if `parent` is null) — children are preserved by
   *     `addCategoryToParent` so non-leaf edits don't drop descendants.
   *  3. Re-points every spending that referenced the old category so
   *     downstream views (Spending tab, totals, history) reflect the
   *     new title / icon / color immediately.
   */
  on(editCategory, (state, action) => {
    const updated = action.payload.category;
    const cleared = removeCategoryFromTree(state.categorySpendings, updated.id);
    const newCategorySpendings = addCategoryToParent(cleared, updated);

    const newSpendingsHistory = state.spendingsHistory.map(spending => {
      if (spending.category && spending.category.id === updated.id) {
        return new Spending(
          spending.isSaved,
          updated,
          spending.comment,
          spending.cost,
          spending.date,
          spending.id,
        );
      }
      return spending;
    });

    return {
      ...state,
      idIncrement: state.idIncrement + 1,
      categorySpendings: newCategorySpendings,
      spendingsHistory: newSpendingsHistory,
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
  // Phase 3a fix (ADR-0012 §"Виправлення багів" bullet 5): logout no
  // longer wipes the store. User reverts to anonymous mode and keeps
  // their local spendings + categories — same device, same data, just
  // without cloud sync. Phase 3b adds the signup-merge wizard and
  // anonymous disclosure on top. Cross-user contamination on a shared
  // browser is a known follow-up — current scope only covers the
  // single-user-on-personal-device case.
  on(logout, (state) => state),
);
