import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MoneyPipe } from '../../../../pipe/money.pipe';
import { TotalBalanceService } from '../../../../core/UI/components/total-balance/total-balance.service';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'pgz-total-balance-spending',
  standalone: true,
  imports: [MoneyPipe],
  templateUrl: './total-balance-spending.component.html',
  styleUrl: './total-balance-spending.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TotalBalanceSpendingComponent implements OnInit {
  public balance: number = 0;
  public spentByMonth: number = 0;
  public monthlyBudget: number = 0;

  constructor(
    private totalBalanceService: TotalBalanceService,
  ) { }

  public ngOnInit(): void {
    combineLatest(
      this.totalBalanceService.getMonthlyBudget(),
      this.totalBalanceService.getSpentByMonth()
    ).subscribe(([ monthlyBudget, spentByMonth ]) => {
      this.monthlyBudget = monthlyBudget;
      this.spentByMonth = spentByMonth;

      this.balance = monthlyBudget - spentByMonth;
    });
  }
}
