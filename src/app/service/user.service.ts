import { Injectable } from '@angular/core';
import { IUSer } from '../model/User';
import { Store, select } from '@ngrx/store';
import { filter } from 'rxjs';
import { IUserState } from '../store/user.reducer';
import { userFeatureSelector } from '../store/user.selectors';
import { addPortfolioID, loadUser } from '../store/user.actions';


@Injectable({
  providedIn: 'root'
})
export class UserService {
  public user: IUSer;
  public isInit: boolean = false;

  private readonly userLocalStorageKey = 'user-info';

  constructor(
    private store$: Store<IUserState>,
  ) { }

  public savePortfolioID(portfolioID: number): void {
    this.store$.dispatch(addPortfolioID({portfolioID}));
  }

  public init(): void {
    if(this.isInit) {
      return;
    }

    this.isInit = true;
    
    this.loadFromStorage();

    this.store$.pipe(
      select(userFeatureSelector),
      filter(state => !!state)
    ).subscribe(userState => {
      localStorage.setItem(this.userLocalStorageKey, JSON.stringify(userState));
    });

    window.addEventListener('storage', () => this.loadFromStorage());
  }

  private loadFromStorage(): void {
    
    const storageState = localStorage.getItem(this.userLocalStorageKey);
    if(storageState) {
      this.store$.dispatch(loadUser({
        userState: JSON.parse(storageState)
      }))
    }
  }
}
