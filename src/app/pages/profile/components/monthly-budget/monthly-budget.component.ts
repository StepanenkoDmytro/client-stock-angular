import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

import { MonthlyBudget, TotalBalanceService } from '../../../../core/UI/components/total-balance/total-balance.service';
import { MoneyDirective } from '../../../../directive/money.directive';
import { PageHeaderComponent } from '../../../../core/UI/components/page-header/page-header.component';

@Component({
  selector: 'pgz-monthly-budget',
  standalone: true,
  imports: [CommonModule, FormsModule, MatInputModule, MatButtonModule, MoneyDirective, PageHeaderComponent],
  templateUrl: './monthly-budget.component.html',
  styleUrl: './monthly-budget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonthlyBudgetComponent implements OnInit {
  public isMonthlyBudgetEnabled: boolean = false;
  public monthlyBudget: number = 0;
  public updateDay: number = 1;

  constructor(
    private totalBalanceService: TotalBalanceService,
    private router: Router,
  ) { }

  public toggleBudget(): void {
    this.isMonthlyBudgetEnabled = !this.isMonthlyBudgetEnabled;
  }

  public ngOnInit(): void {
    this.totalBalanceService.getMonthlyBudget().subscribe(budget => {
      this.isMonthlyBudgetEnabled = budget.isEnabled;
      this.monthlyBudget = budget.amount;
    });
  }

  public save(): void {
    const budgetData: MonthlyBudget = {
      amount: this.monthlyBudget,
      isEnabled: this.isMonthlyBudgetEnabled,
    };
    this.totalBalanceService.saveMonthlyBudget(budgetData);
  }

  public prevRoute(): void {
    this.router.navigate(['/profile']);
  }
}
