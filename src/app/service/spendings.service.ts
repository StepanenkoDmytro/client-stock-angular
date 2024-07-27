import { Injectable } from '@angular/core';
import { Observable, concatMap, filter, firstValueFrom, from, map, of } from 'rxjs';
import moment from 'moment';
import { ISpendingsState } from '../pages/spending/store/spendings.reducer';
import { Store, select } from '@ngrx/store';
import { spendingsHistorySelector, spendingsFeatureSelector, categoriesSpendindSelector } from '../pages/spending/store/spendings.selectors';
import { addCategory, addSpending, deleteCategory, deleteSpending, editSpending, loadCategories, loadSpending } from '../pages/spending/store/spendings.actions';
import { Spending } from '../pages/spending/model/Spending';
import { Category } from '../domain/category.domain';


@Injectable({
  providedIn: 'root'
})
export class SpendingsService {
  private readonly spendingHistoryLocalStorageKey = 'spendings-history';
  public isInit: boolean = false;

  constructor(
    private store$: Store<ISpendingsState>,
  ) { }

  /* Spendings */
  public getSpendingsByRange(start: moment.Moment, end: moment.Moment): Observable<Spending[]> {
    return this.getAllSpendings().pipe(
      map(spendings => spendings.filter(spending => {
        const spendingDate = moment(spending.date);
        return spendingDate.isBetween(start, end, 'day', '[]');
      }))
    );
  }

  public loadByDate(date: moment.Moment): Observable<Spending[]> {
    return this.getAllSpendings().pipe(
      map(spendingList => 
        spendingList.filter(spending => 
          moment(spending.date).startOf('day').isSame(date.startOf('day'))))
    );
  }

  public loadByCurrentMonth(): Observable<Spending[]> {
    return this.getAllSpendings().pipe(
      map(spendingList => 
        spendingList.filter(spending => 
          moment(spending.date).startOf('month').isSame(moment().startOf('month'))))
    );
  }

  public getSpentByDay(): Observable<number> {
    const currentDay = moment(new Date);
    return this.loadByDate(currentDay).pipe(
      map(spendingList => {
        if (spendingList) {
          return spendingList
            .map(spend => spend.cost)
            .reduce((accumulator, cost) => accumulator + cost, 0);
        }
        return 0; 
      })
    );
  }

  public addSpending(spending: Spending): void {
    if(spending.comment === null) {
      throw Error('cost or name of product can not be null')
    }

    this.store$.dispatch(addSpending({ spending }));
  }

  public editSpending(spending: Spending): void {
    this.store$.dispatch(editSpending({ spending }));
  }

  public deleteSpending(spending: Spending): void {
    const id = spending.id;
    this.store$.dispatch(deleteSpending({id}));
  }

  public getSpendingsByCategory(category: Category): Observable<Spending[]> {
    return this.getAllSpendings().pipe(map(
      spendings => spendings.filter(spending => spending.category.id === category.id)
    ));
  }

  public getAllSpendings(): Observable<Spending[]> {
    return this.store$.pipe(select(spendingsHistorySelector));
  }

  /* Categories */

  public addCategory(category: Category): void {
    if(category.title === null) {
      throw Error('title of category can not be null')
    }
    
    this.store$.dispatch(addCategory({ category }));
  }

  public replaceCategoryInSpendings(newCategory: Category, spendings: Spending[]): void {
    spendings
      .map(spending => new Spending(false, newCategory, spending.comment, spending.cost, spending.date, spending.id))
      .forEach(spending => this.editSpending(spending));
  }

  public async findCategoryById(categoryId: string): Promise<Category> {
    const allCategories: Category[] = await firstValueFrom(this.getAllCategories());
    return Category.findCategoryById(categoryId, allCategories);
  }

  public async editCategory(updatedCategory: Category): Promise<void> {
    const existingCategory = await this.findCategoryById(updatedCategory.id);

    if(existingCategory.parent != updatedCategory.parent) {
      const spendingsByCategory: Spending[] = await firstValueFrom(this.getSpendingsByCategory(existingCategory));
      this.replaceCategoryInSpendings(updatedCategory, spendingsByCategory);
    }

    this.deleteCategory(existingCategory);
    this.addCategory(updatedCategory);
  }

  public async deleteCategory(category: Category): Promise<void> {
    if(!category.parent) {
      console.error('Can not delete root category');
      return;
    }    

    this.store$.dispatch(deleteCategory({category}));
  }

  public getAllCategories(): Observable<Category[]> {
    return this.store$.pipe(select(categoriesSpendindSelector));
  }

  public findSpendingsByCategoryIncludeChildren(spendings: Spending[], category: Category): Spending[] {
    
    let spendingsByCategory = spendings.filter(spending => spending.category.id === category.id);

    if(category.children.length > 0) {
      category.children.forEach(child => {
        const spendingsByChildCategory = this.findSpendingsByCategoryIncludeChildren(spendings, child);
        spendingsByCategory = [...spendingsByCategory, ...spendingsByChildCategory];
      });
    }
    return spendingsByCategory;
  }

  public init(): void {
    if(this.isInit) {
      return;
    }

    this.isInit = true;
    
    this.loadFromStorage();

    this.store$.pipe(
      select(spendingsFeatureSelector),
      filter(state => !!state)
      ).subscribe(spendingHistoryState => {
      localStorage.setItem(this.spendingHistoryLocalStorageKey, JSON.stringify(spendingHistoryState));
    });

    window.addEventListener('storage', () => this.loadFromStorage());
  }

  public loadFromStorage(): void {
    
    const storageState = localStorage.getItem(this.spendingHistoryLocalStorageKey);

    if (storageState) {
      from([
        loadCategories({ state: JSON.parse(storageState) }),
        loadSpending({ state: JSON.parse(storageState) }),
      ]).pipe(
        concatMap(action => of(this.store$.dispatch(action)))
      ).subscribe();
    }
  }
}
