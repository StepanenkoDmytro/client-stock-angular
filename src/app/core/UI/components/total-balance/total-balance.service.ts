import { Injectable } from '@angular/core';
import { SpendingsService } from '../../../../service/spendings.service';
import { BehaviorSubject, Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TotalBalanceService {

  private readonly budgetLocalStorageKey = 'spending_budget';
  private monthlyBudget$: BehaviorSubject<number> = new BehaviorSubject<number>(0);

  constructor(
    private spendingsService: SpendingsService
  ) { }

  public getMonthlyBudget(): Observable<number> {
    
    const budgetStoredData = localStorage.getItem(this.budgetLocalStorageKey);
    const parseBudget: number = JSON.parse(budgetStoredData);
    
    if(parseBudget) {
      this.monthlyBudget$.next(parseBudget);
    }
    
    return this.monthlyBudget$;
  }

  public saveMonthlyBudget(budget: number): void {
    localStorage.setItem(this.budgetLocalStorageKey, JSON.stringify(budget));
    this.monthlyBudget$.next(budget);
  }

  public getSpentByMonth(): Observable<number> {
    return this.spendingsService.loadByCurrentMonth().pipe(
      map(spendingList => 
        spendingList
          .map(spend => spend.cost)
          .reduce((accumulator, cost) => accumulator + cost, 0)
      )
    );
  }
}
