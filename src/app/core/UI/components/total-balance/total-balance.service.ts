import { Injectable } from '@angular/core';
import { SpendingsService } from '../../../../service/spendings.service';
import { BehaviorSubject, Observable, map } from 'rxjs';

export interface MonthlyBudget {
  amount: number;
  isEnabled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TotalBalanceService {

  private readonly budgetLocalStorageKey = 'spending_budget';
  private monthlyBudget$: BehaviorSubject<MonthlyBudget> = new BehaviorSubject<MonthlyBudget>({
    amount: 0,
    isEnabled: false,
  });

  constructor(
    private spendingsService: SpendingsService
  ) { }

  public getMonthlyBudget(): Observable<MonthlyBudget> {
    
    const budgetStoredData = localStorage.getItem(this.budgetLocalStorageKey);
    if (budgetStoredData) {
      const parsedBudget: MonthlyBudget = JSON.parse(budgetStoredData);
      this.monthlyBudget$.next(parsedBudget);
    }
    return this.monthlyBudget$.asObservable();
  }

  public saveMonthlyBudget(budget: MonthlyBudget): void {
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
