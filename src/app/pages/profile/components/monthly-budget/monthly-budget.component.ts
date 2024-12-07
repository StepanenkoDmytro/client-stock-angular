import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { PrevRouteComponent } from '../../../../core/UI/components/prev-route/prev-route.component';
import { Router } from '@angular/router';
import { TotalBalanceService } from '../../../../core/UI/components/total-balance/total-balance.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'pgz-monthly-budget',
  standalone: true,
  imports: [PrevRouteComponent, FormsModule],
  templateUrl: './monthly-budget.component.html',
  styleUrl: './monthly-budget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MonthlyBudgetComponent implements OnInit {
  isMonthlyBudgetEnabled: boolean = false;
  public monthlyBudget: number = 0;
  updateDay: number = 1;

  constructor(
    private totalBalanceService: TotalBalanceService,
    private router: Router
  ) { }

  public toggleBudget(): void {
    this.isMonthlyBudgetEnabled = !this.isMonthlyBudgetEnabled;
  }

  public ngOnInit(): void {
    this.totalBalanceService.getMonthlyBudget().subscribe(budget => {
      this.monthlyBudget = budget;
    })
  }

  public prevRoute(): void {
    this.router.navigate(['/profile']);
  }

  public changeMonthlyBudget(): void {
    this.totalBalanceService.saveMonthlyBudget(this.monthlyBudget);
  }
}
