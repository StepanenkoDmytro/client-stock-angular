import { Injectable, inject } from '@angular/core';
import { SpendingsService } from '../../../../service/spendings.service';
import { BehaviorSubject, Observable, map, switchMap } from 'rxjs';
import { FxRateService } from '../../../../service/fx-rate.service';
import { UserPreferencesService } from '../../../../pages/savings/service/user-preferences.service';
import { DEFAULT_SPENDING_CURRENCY } from '../../../../pages/spending/model/Spending';

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

  private readonly fxRate = inject(FxRateService);
  private readonly userPrefs = inject(UserPreferencesService);

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

  /**
   * Sum of all current-month spendings, converted into the user's
   * baseCurrency via the FX cache (ADR-0002 §Spendings). Triggers a
   * batch preload of all distinct currencies present in the month —
   * subsequent renders are cache hits.
   */
  public getSpentByMonth(): Observable<number> {
    return this.spendingsService.loadByCurrentMonth().pipe(
      switchMap(spendingList => {
        const base = this.userPrefs.baseCurrency() ?? DEFAULT_SPENDING_CURRENCY;
        const currencies = Array.from(new Set(
          spendingList.map(s => s.currency).filter((c): c is string => !!c),
        ));
        return this.fxRate.preload(base, currencies).pipe(
          map(() => spendingList.reduce((sum, s) => {
            const native = s.currency ?? base;
            // Spot-rate aggregation (no `at`): we preload once per session
            // under the "today" key, then sum at that snapshot. Per-date
            // historical FX is a future refinement, not needed for monthly
            // / category totals where the user wants "what would this cost
            // in baseCurrency right now".
            const converted = this.fxRate.convertSync(s.cost, native, base);
            return sum + (converted ?? s.cost);
          }, 0)),
        );
      }),
    );
  }
}
