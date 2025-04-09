import { Injectable } from '@angular/core';
import { IUser } from '../model/User';
import { Store, select } from '@ngrx/store';
import { BehaviorSubject, Observable, filter } from 'rxjs';
import { IUserState } from '../store/user.reducer';
import { userFeatureSelector } from '../store/user.selectors';
import { loadUser, logout, saveUser } from '../store/user.actions';
import { IUserApi } from '../domain/user.domain';


@Injectable({
  providedIn: 'root'
})
export class UserService {
  private user: BehaviorSubject<IUser> = new BehaviorSubject<IUser>(null);
  public isInit: boolean = false;

  private readonly userLocalStorageKey = 'user-info';

  constructor(
    private store$: Store<IUserState>,
  ) { }

  public getUser(): Observable<IUser> {
    return this.user;
  }

  public saveUser(user: IUserApi): void {
    const newUser: IUser = this.mapUserFromApi(user);
    this.store$.dispatch(saveUser({user: newUser}));
  }

  public saveIUser(user: IUser): void {
    this.store$.dispatch(saveUser({user: user}));
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
      id: user.id,
      email: user.email,
      portfolioID: user.portfolio[0].id,
    };
  }
}
