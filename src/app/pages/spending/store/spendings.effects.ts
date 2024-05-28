import { Injectable } from '@angular/core';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { EMPTY, Observable, firstValueFrom, of } from 'rxjs';
import { catchError, filter, map, mergeMap, switchMap, tap, withLatestFrom} from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { addCategory, addMultipleSpendings, addSpending, deleteSpending, editSpending, loadCategories, loadServerCategories, loadSpending } from './spendings.actions';
import { AuthService } from '../../../service/auth.service';
import { Spending } from '../model/Spending';
import { ISavingsState } from '../../savings/store/asset.reducer';
import { Store } from '@ngrx/store';
import { selectPortfolioID } from '../../../store/user.selectors';
import { ISpendingsState } from './spendings.reducer';
import { categoriesSpendindSelector } from './spendings.selectors';
import { Category, ICategoryApi } from '../../../domain/category.domain';


@Injectable()
export class SpendingsEffects {
  private readonly url: string = 'http://localhost:8000/api/v1/profile/';

  constructor(
    private actions$: Actions,
    private http: HttpClient,
    private authService: AuthService,
    private store: Store<ISavingsState>,
  ) {}

  addSpending$ = createEffect(() => this.actions$.pipe(
    ofType(addSpending, editSpending),
    filter(() => !!this.authService.authToken),
    withLatestFrom(this.store.select(selectPortfolioID)),
    withLatestFrom(this.store.select(categoriesSpendindSelector)),
    switchMap(([[action, portfolioID], categories]) => {
      const newSpending = action.payload.spending;
      
      if(!newSpending.isSaved) {
        return this.sendSpendingToServer(portfolioID, newSpending, categories);
      } else {
        return EMPTY;
      }
    })
  ), { dispatch: false });

  loadSpendings$ = createEffect(() => this.actions$.pipe(
    ofType(loadSpending),
    filter(() => !!this.authService.authToken),
    withLatestFrom(this.store.select(selectPortfolioID)),
    withLatestFrom(this.store.select(categoriesSpendindSelector)),
    switchMap(([[action, portfolioID], categories]) => {
      return this.syncSpendingListWithServer(action.payload.state, portfolioID, categories);
    })
  ), { dispatch: false });

  deleteSpending$ = createEffect(() => this.actions$.pipe(
    ofType(deleteSpending),
    filter(() => !!this.authService.authToken),
    mergeMap(action => {
      const deleteUrl = this.url + 'delete-spending/' + action.payload.id;

      return this.http.delete(deleteUrl).pipe(
        map(() => console.log('success deleting spending')), 
        catchError(error => of(console.log({ error }))) 
      );
    })
  ), { dispatch: false });

  addCategory$ = createEffect(() => this.actions$.pipe(
    ofType(addCategory),
    filter(() => !!this.authService.authToken),
    withLatestFrom(this.store.select(selectPortfolioID)),
    switchMap(([action, portfolioID]) => {
      const newCategory = action.payload.category;
      // console.log('addCategory$', newCategory);
      if(!newCategory.isSaved) {
        return this.sendCategoryToServer(portfolioID, newCategory);
      } else {
        return EMPTY;
      }
    })
  ), { dispatch: false });

  loadCategories$ = createEffect(() => this.actions$.pipe(
    ofType(loadCategories),
    filter(() => !!this.authService.authToken),
    withLatestFrom(this.store.select(selectPortfolioID)),
    switchMap(([action, portfolioID]) => {
      return this.syncCategoriesListWithServer(action.payload.state, portfolioID);
    })
  ), { dispatch: false });


  private sendSpendingToServer(portfolioID: number, spending: Spending, categories: Category[]): Observable<Spending> {
    const transformedToApi = Spending.mapToSpendingApi(spending);

    const savedSpendingUrl = this.url + portfolioID + '/add-spending';
    return this.http.post(savedSpendingUrl, transformedToApi).pipe(
      tap((response: any) => {
        const transformedFromApi = Spending.mapFromSpendingApi(response, categories);
        this.store.dispatch(editSpending({ spending: transformedFromApi }));
      }), 
      catchError(error => {
        console.error('Error occurred while saving spending:', error);
        return EMPTY;
      })
    );
  }

  private syncSpendingListWithServer(spendingState: ISpendingsState, portfolioID: number, categories: Category[]): Observable<ISpendingsState> {
    const loadSpendingsUrl = this.url + 'spendings-list/' + portfolioID;
    return this.http.get<Spending[]>(loadSpendingsUrl).pipe(
      map(serverSpendings => {
        
        const clientSpendings = spendingState.spendingsHistory;
        const newSpendingsFromServer = this.filterNewSpendingsFromServer(serverSpendings, clientSpendings, categories);
        
        if (newSpendingsFromServer.length > 0) {
          this.store.dispatch(addMultipleSpendings({ spendings: newSpendingsFromServer }));
        }

        this.sendUnsavedSpendingsToServer(clientSpendings);
        
        return spendingState; 
      }),
      catchError(error => {
        console.error('Error occurred while loading spending:', error);
        return EMPTY;
      })
    );
  }

  private filterNewSpendingsFromServer(serverSpendings: Spending[], clientSpendings: Spending[], categories: Category[]): Spending[] {
    return serverSpendings.filter(serverSpending => 
      !clientSpendings.some(clientSpending => serverSpending.id === clientSpending.id)
    ).map(spending => Spending.mapFromSpendingApi(spending, categories));
  }

  private sendUnsavedSpendingsToServer(clientSpendings: Spending[]): void {
    clientSpendings
      .filter(spending => !spending.isSaved)
      .forEach(unsavedSpending => {
        this.store.dispatch(addSpending({ spending: unsavedSpending }));
      });
  }

  private syncCategoriesListWithServer(categoryState: ISpendingsState, portfolioID: number): Observable<ISpendingsState> {
    const loadCategoriesUrl = this.url + 'categories-list/' + portfolioID;
    return this.http.get<any>(loadCategoriesUrl).pipe(
      map(serverCategories => {
        // debugger;
        //TODO: create transform method for serverSpendings: swap categoryId on category
        const clientCategories = categoryState.categorySpendings;
        const flattenCategories = this.flattenCategories(clientCategories);
        const isServerCategories = this.isFirstCategoryInitialization(serverCategories, flattenCategories);
        
        
        if(isServerCategories && serverCategories.length > 0) {
          console.log('loh');
          const newCategorySpendings = this.buildCategoryTree(serverCategories);
          
          categoryState = {
            ...categoryState,
            idIncrement: categoryState.idIncrement + 1,
            categorySpendings: newCategorySpendings
          };
          this.store.dispatch(loadServerCategories({state: categoryState}));
          // return newState;
        } else {
          const newCategoriesFromServer = this.filterNewCategoriesFromServer(serverCategories, flattenCategories);
          newCategoriesFromServer.forEach(category => {
            this.store.dispatch(addCategory({category, parentId: category.parent}));
          });
          
        }

        this.sendUnsavedCategoriesToServer(portfolioID, flattenCategories);
        // const newCategoriesFromServer = this.filterNewCategoriesFromServer(serverCategories, flattenCategories);
        // //якщо видалити localStorage, то апку створить категорії з новими id, а з сервера прийдуть старі id (продумать)
        // if (newCategoriesFromServer.length > 0) {
        //   console.log('second', newCategoriesFromServer, flattenCategories);
        //   newCategoriesFromServer.forEach(category => {
        //     const parentId = category.parent;
        //     // this.store.dispatch(addCategory({category, parentId}));
        //   });
        // }

        
        
        return categoryState; 
      }),
      catchError(error => {
        console.error('Error occurred while loading spending:', error);
        return EMPTY;
      })
    );
  }

  private buildCategoryTree(categories: Category[]): Category[] {
  const categoryMap: Map<string, Category> = new Map();
  categories.forEach(category => {
    categoryMap.set(category.id, Category.mapFromCategoryApi(category));
  });

  const rootCategories: Category[] = [];

  const addChildCategories = (parentCategory: Category) => {
    const children = categories.filter(category => category.parent === parentCategory.id);
    children.forEach(child => {
      const childCategory = categoryMap.get(child.id);
      parentCategory.children.push(childCategory);
      addChildCategories(childCategory); 
    });
  };

  categories.forEach(category => {
    if (!category.parent) {
      rootCategories.push(categoryMap.get(category.id));
      addChildCategories(categoryMap.get(category.id));
    }
  });

  return rootCategories;
}


  private flattenCategories(categories: Category[]): Category[] {
    const flattenedCategories: Category[] = [];

    function flatten(category: Category) {
        flattenedCategories.push(category);
        if (category.children.length > 0) {
            category.children.forEach(child => flatten(child));
        }
    }

    categories.forEach(category => flatten(category));

    return flattenedCategories;
  }

  private filterNewCategoriesFromServer(serverCategories: Category[], clientCategories: Category[]): Category[] {
    return serverCategories
      .filter(serverCategory => 
        !clientCategories.some(clientCategory => serverCategory.id === clientCategory.id))
      .map(category => Category.mapFromCategoryApi(category));
  }

  private isFirstCategoryInitialization(serverCategories: Category[], clientCategories: Category[]): boolean {
    
    const findBasicServerCategories: string[] = serverCategories.filter(category => category.parent == null).map(category => category.id);
    const findBasicClientCategories: string[] = clientCategories.filter(category => category.parent == null).map(category => category.id);
    
    return findBasicClientCategories.every(clientId =>
      !findBasicServerCategories.includes(clientId)
    );
  }

  private sendUnsavedCategoriesToServer(portfolioID: number, categories: Category[]): void {
    
    categories
      .filter(category => !category.isSaved)
      .forEach(async unsavedCategory => {
        await firstValueFrom(this.sendCategoryToServer(portfolioID, unsavedCategory));
      });
  }

  private sendCategoryToServer(portfolioID: number, category: Category): Observable<Category> {
    const transformedToApi = Category.mapToCategoryApi(category);
    
    transformedToApi.saved = true;
// console.log('transformed TO Api',transformedToApi);
    const savedCategoryUrl = this.url + portfolioID + '/add-category';
    // console.log(savedCategoryUrl);

    return this.http.post(savedCategoryUrl, transformedToApi).pipe(
      tap((response: any) => {
        // console.log('response', response);
        const transformedFromApi = Category.mapFromCategoryApi(response);
        // console.log('transformed FROM Api',transformedFromApi);
        this.store.dispatch(addCategory({ category: transformedFromApi, parentId: transformedFromApi.parent }));
      }),
      catchError(error => {
        console.error('Error occurred while saving spending:', error);
        return EMPTY;
      })
    );
    // return of(Category.mapFromCategoryApi(transformedToApi)).pipe(tap(category => {
    //   this.store.dispatch(addCategory({ category: category, parentId: category.parent }));
    // }));
  }

}
