import { Injectable } from '@angular/core';
import { Observable, map, catchError, EMPTY, firstValueFrom, tap } from 'rxjs';
import { resetCategories, addCategory } from '../store/spendings.actions';
import { ISpendingsState } from '../store/spendings.reducer';
import { HttpClient } from '@angular/common/http';
import { Category, ICategoryApi } from '../../../domain/category.domain';
import { Store } from '@ngrx/store';
import { environment } from '../../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class CategiriesSyncService {
  private readonly url: string = `${environment.apiBaseUrl}/profile/`;

  constructor(
    private http: HttpClient,
    private store: Store<ISpendingsState>,
  ) { }

  // Phase 3a — `navigator.onLine` guards removed; rely on the global
  // ApiErrorInterceptor for the snackbar (ADR-0012 §"Виправлення багів"
  // bullet 1). On failure the category stays in the store with
  // `isSaved: false` and the next sync re-attempts via
  // `sendUnsavedCategoriesToServer`.

  public sendCategoryToServer(portfolioID: number, category: Category): Observable<Category> {
    const savedCategoryUrl = this.url + portfolioID + '/add-category';
    const categoryDTO = Category.mapToCategoryApi(category);

    return this.http.post(savedCategoryUrl, categoryDTO).pipe(
      tap((response: any) => {
        const newCategory = Category.mapFromCategoryApi(response);
        this.store.dispatch(addCategory({ category: newCategory }));
      }),
      catchError(() => EMPTY),
    );
  }

  /**
   * Batch insert for Excel/CSV import (per task §3.2). One POST → server
   * persists atomically. Dispatches `addCategory` per saved category so
   * the store gets `isSaved: true` for each.
   */
  public sendCategoriesBatchToServer(portfolioID: number, categories: Category[]): Observable<Category[]> {
    const batchUrl = this.url + portfolioID + '/categories/batch';
    const payload = categories.map(c => Category.mapToCategoryApi(c));

    return this.http.post<any[]>(batchUrl, payload).pipe(
      map(response => response.map(api => Category.mapFromCategoryApi(api))),
      tap(savedCategories => {
        savedCategories.forEach(category => {
          this.store.dispatch(addCategory({ category }));
        });
      }),
      catchError(() => EMPTY),
    );
  }

  /**
   * Atomic server-side merge (task §2.6). Re-points spendings,
   * relocates children, deletes source — all in one transaction.
   */
  public mergeCategoryOnServer(portfolioID: number, sourceId: string, targetId: string): Observable<void> {
    const mergeUrl = this.url + portfolioID + '/merge-category/' + sourceId + '?into=' + encodeURIComponent(targetId);
    return this.http.post<void>(mergeUrl, null).pipe(
      map(() => undefined),
      catchError(() => EMPTY),
    );
  }

  public deleteCategory(category: Category): Observable<void> {
    const deleteUrl = this.url + 'delete-category/' + category.id;

    return this.http.delete<void>(deleteUrl).pipe(
      map(() => undefined),
      catchError(() => EMPTY),
    );
  }

  public syncCategoriesListWithServer(categoryState: ISpendingsState, portfolioID: number): Observable<void> {
    const loadCategoriesUrl = this.url + 'categories-list/' + portfolioID;
    return this.http.get<any>(loadCategoriesUrl).pipe(
      map(serverCategories => {
        return this.updateStateWithSyncCategory(serverCategories, categoryState, portfolioID);
      }),
      catchError(() => EMPTY),
    );
  }
  
  private updateStateWithSyncCategory(serverCategories: ICategoryApi[], categoryState: ISpendingsState, portfolioID: number ): void {
    const clientCategories = categoryState.categorySpendings;
    const flattenCategories = this.flattenCategories(clientCategories);
    const isFirstAPIInit = this.isFirstCategoryAPIInit(serverCategories, flattenCategories);
    
    if(isFirstAPIInit && serverCategories.length > 0) {
      const newCategorySpendings = this.buildCategoryTreeFromServer(serverCategories);
      this.store.dispatch(resetCategories({categorySpendings: newCategorySpendings}));
    } else {
      const newCategoriesFromServer = this.filterNewCategoriesFromServer(serverCategories, flattenCategories);
      newCategoriesFromServer.forEach(category => {
        this.store.dispatch(addCategory({category}));
      });

      this.sendUnsavedCategoriesToServer(portfolioID, flattenCategories);
    }
  }

  private flattenCategories(categories: Category[]): Category[] {
    const flattenedCategories: Category[] = [];

    const flatten = (category: Category) => {
      flattenedCategories.push(category);
      if (category.children.length > 0) {
          category.children.forEach(child => flatten(child));
      }
    }

    categories.forEach(category => flatten(category));

    return flattenedCategories;
  }

  private isFirstCategoryAPIInit(serverCategories: ICategoryApi[], clientCategories: Category[]): boolean {
    
    const findBasicServerCategories: string[] = serverCategories.filter(category => !category.parent).map(category => category.id);
    const findBasicClientCategories: string[] = clientCategories.filter(category => !category.parent).map(category => category.id);
    
    return findBasicClientCategories.every(clientId =>
      !findBasicServerCategories.includes(clientId)
    );
  }

  private buildCategoryTreeFromServer(categories: ICategoryApi[]): Category[] {
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

  private filterNewCategoriesFromServer(serverCategories: ICategoryApi[], clientCategories: Category[]): Category[] {
    return serverCategories
      .filter(serverCategory => {
        const isCategoryAbsentOnClient: boolean = !clientCategories
          .some(clientCategory => serverCategory.id === clientCategory.id);

        return isCategoryAbsentOnClient;
      })
      .map(category => Category.mapFromCategoryApi(category));
  }

  private sendUnsavedCategoriesToServer(portfolioID: number, categories: Category[]): void {
    categories
      .filter(category => !category.isSaved)
      .forEach(async unsavedCategory => {
        await firstValueFrom(this.sendCategoryToServer(portfolioID, unsavedCategory));
      });
  }
}
