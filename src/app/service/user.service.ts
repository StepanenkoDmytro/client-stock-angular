import { Injectable } from '@angular/core';
import { IUser } from '../model/User';
import { Store, select } from '@ngrx/store';
import { BehaviorSubject, Observable, filter, lastValueFrom } from 'rxjs';
import { IUserState } from '../store/user.reducer';
import { userFeatureSelector } from '../store/user.selectors';
import { loadUser, logout, saveUser } from '../store/user.actions';
import { IUserApi } from '../domain/user.domain';
import { SpendingsService } from '../service/spendings.service';
import { Spending } from '../pages/spending/model/Spending';


@Injectable({
  providedIn: 'root'
})
export class UserService {
  private user: BehaviorSubject<IUser> = new BehaviorSubject<IUser>(null);
  public isInit: boolean = false;

  private readonly userLocalStorageKey = 'user-info';

  constructor(
    private store$: Store<IUserState>,
    private spendingService: SpendingsService
  ) { }

  public getUser(): Observable<IUser> {
    return this.user;
  }

  public saveUser(user: IUserApi): void {
    const newUser: IUser = this.mapUserFromApi(user);
    this.store$.dispatch(saveUser({user: newUser}));
  }

  public async hasUnsavedDataOnServer(): Promise<boolean> {
    try{
    const allSpendings: Spending[] = await lastValueFrom(this.spendingService.getAll());
    return allSpendings.some(spending => spending.isSaved === false);
    } catch (error) {
      console.error('hasUnsavedDataOnServer: ', error);
      return false;
    }
  }

  public uploadUnsavedDataToServer(): void {
    this.spendingService.loadFromStorage();
  }

  public deleteUnsavedData(): void {
    this.spendingService.deleteUnsavedSpendings();
  }

  public logout(): void {
    this.store$.dispatch(logout());
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
      this.user.next(userState.user);

      localStorage.setItem(this.userLocalStorageKey, JSON.stringify(userState));
    });

    window.addEventListener('storage', () => this.loadFromStorage());
  }

  private loadFromStorage(): void {
    
    const storageState = localStorage.getItem(this.userLocalStorageKey);
    if(storageState) {
      const userState: IUserState = JSON.parse(storageState);
      this.user.next(userState.user);
      
      this.store$.dispatch(loadUser({
        userState: userState
      }));
    }
  }

  private mapUserFromApi(user: IUserApi): IUser {
    return {
      email: user.email,
      portfolioID: user.portfolio[0].id,
    };
  }
}
