import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { PrevRouteComponent } from '../../../../core/UI/components/prev-route/prev-route.component';
import { Router } from '@angular/router';
import { MonthlyBudget, TotalBalanceService } from '../../../../core/UI/components/total-balance/total-balance.service';
import { FormsModule } from '@angular/forms';
import { AcceptBtnComponent } from '../../../../core/UI/components/accept-btn/accept-btn.component';
import { MoneyDirective } from '../../../../directive/money.directive';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'pgz-monthly-budget',
  standalone: true,
  imports: [CommonModule, PrevRouteComponent, FormsModule, AcceptBtnComponent, MoneyDirective, MatInputModule],
  templateUrl: './monthly-budget.component.html',
  styleUrl: './monthly-budget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MonthlyBudgetComponent implements OnInit {
  public isMonthlyBudgetEnabled: boolean = false;
  public monthlyBudget: number = 0;
  public updateDay: number = 1;

  constructor(
    private totalBalanceService: TotalBalanceService,
    private router: Router
  ) { }

  public toggleBudget(): void {
    this.isMonthlyBudgetEnabled = !this.isMonthlyBudgetEnabled;
  }

  public ngOnInit(): void {
    this.totalBalanceService.getMonthlyBudget().subscribe(budget => {
      this.isMonthlyBudgetEnabled = budget.isEnabled;
      this.monthlyBudget = budget.amount;
    })
  }

  public save(): void {
    this.changeMonthlyBudget();
  }

  public prevRoute(): void {
    this.router.navigate(['/profile']);
  }

  public changeMonthlyBudget(): void {
    const budgetData: MonthlyBudget = {
      amount: this.monthlyBudget,
      isEnabled: this.isMonthlyBudgetEnabled
    };
    this.totalBalanceService.saveMonthlyBudget(budgetData);
  }
}
