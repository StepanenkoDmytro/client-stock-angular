import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { PrevRouteComponent } from '../../../../core/UI/components/prev-route/prev-route.component';
import { Router } from '@angular/router';
import { TotalBalanceService } from '../../../../core/UI/components/total-balance/total-balance.service';

@Component({
  selector: 'pgz-monthly-budget',
  standalone: true,
  imports: [PrevRouteComponent],
  templateUrl: './monthly-budget.component.html',
  styleUrl: './monthly-budget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MonthlyBudgetComponent implements OnInit {
  public monthlyBudget: number = 0;

  constructor(
    private totalBalanceService: TotalBalanceService,
    private router: Router
  ) { }

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
