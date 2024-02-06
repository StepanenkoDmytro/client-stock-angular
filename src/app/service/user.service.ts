import { Injectable } from '@angular/core';


@Injectable({
  providedIn: 'root'
})
export class UserService {
  // private readonly historyLocalStorageKey = 'user-state';
  private isInit: boolean = false;

  constructor() { }

  public init(): void {
    if(this.isInit) {
      return;
    }

    this.isInit = true;
 
    // this.loadFromStorage();

    // this.store$.pipe(
    //   select(userFeatureSelector),
    //   // filter(state => !!state)
    //   ).subscribe(spendingHistoryState => {
    //   localStorage.setItem(this.historyLocalStorageKey, JSON.stringify(spendingHistoryState));
    // });

    // window.addEventListener('storage', () => this.loadFromStorage());
  }

  // private loadFromStorage(): void {
  //   const storageState = localStorage.getItem(this.historyLocalStorageKey);
  //   if(storageState) {
  //     this.store$.dispatch(loadUser({
  //       state: JSON.parse(storageState)
  //     }))
  //   }
  // }
}
