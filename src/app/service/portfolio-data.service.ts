import { Injectable } from '@angular/core';
import { IPortfolio, IPortfolioBasic, IPortfolioStock, IUser } from '../domain/portfolio.domain';
import { USER_MOCK } from '../domain/mock.domain';
import { BehaviorSubject, Observable, filter, map } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class PortfolioDataService {

  private _user: IUser = USER_MOCK;
  private _userPortfolios$: BehaviorSubject<IPortfolio[]> = new BehaviorSubject<IPortfolio[]>([]);

  constructor() {
      // TODO: 
      // Лешка, при обновлении страниці заново инициализируеться сервис с дефолтнім значением
      // тут наверное нужен localStorage, но я без тебя пока не пишу
    if (this._user.accounts) {
      this._userPortfolios$ = new BehaviorSubject<IPortfolio[]>(this._user.accounts);
    }

    const defaultAccount = this._user.accounts[0];
    if(!!defaultAccount) {
      this.setActiveAccount(defaultAccount.accountID);
    }
  }

  public get portfolios$(): Observable<IPortfolio[]> {
    return this._userPortfolios$.asObservable();
  }

  public setActiveAccount(portfolioID: number): void {
    const portfolios = this._userPortfolios$.value;
    portfolios.forEach((portfolio: IPortfolio) => portfolio.isActive = portfolio.accountID === portfolioID);
   
    this._userPortfolios$.next([...portfolios]);
  }

  public get stocksFromActivePortfolio$(): Observable<IPortfolioStock[]> {
    return this._userPortfolios$.pipe(
      map((portfolios: IPortfolio[]) => {
        const active = portfolios.find((portfolio: IPortfolio) => portfolio.isActive) || portfolios[0];
        return active.stocks;
      })
    );
  }
}
