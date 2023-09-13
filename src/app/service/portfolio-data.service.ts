import { Injectable } from '@angular/core';
import { IPortfolio, IPortfolioBasic, IPortfolioStock, IUser } from '../domain/portfolio.domain';
import { USER_MOCK } from '../domain/mock.domain';
import { BehaviorSubject, Observable, map } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class PortfolioDataService {

  private _user: IUser = USER_MOCK;
  private _activePortfolio: BehaviorSubject<IPortfolio | null>;

  constructor() {
    //TODO: 
      // Лешка, при обновлении страниці заново инициализируеться сервис с дефолтнім значением
      // тут наверное нужен localStorage, но я без тебя пока не пишу
    if (this._user.accounts.length > 0) {
      this._activePortfolio = new BehaviorSubject<IPortfolio | null>(this._user.accounts[0]);
    } else {
      this._activePortfolio = new BehaviorSubject<IPortfolio | null>(null);
    }
  }

  public get activePortfolio$(): Observable<IPortfolio | null> {
    return this._activePortfolio.asObservable();
  }

  public get stockFromActivePortfolio$(): Observable<IPortfolioStock[]> {
    return this._activePortfolio.pipe(
      map(activePortfolio => activePortfolio ? activePortfolio.stocks : [])
    );
  }

  public get portfolios(): IPortfolioBasic[] {
    return this._user.accounts.map((account) => {
      const {coins, stocks, ...info} = account;
      return info;
    });
  }

  public setActiveAccount(portfolioID: number): void {
    const foundAccount = this._user.accounts.find((account) => account.accountID === portfolioID);
    if (foundAccount) {
      this._activePortfolio.next(foundAccount);
    }    
  }
}
