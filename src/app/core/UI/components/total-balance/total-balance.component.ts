import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MoneyPipe } from '../../../../pipe/money.pipe';
import { combineLatest } from 'rxjs';
import { TotalBalanceService } from './total-balance.service';


@Component({
  selector: 'pgz-total-balance',
  standalone: true,
  imports: [MoneyPipe],
  templateUrl: './total-balance.component.html',
  styleUrl: './total-balance.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TotalBalanceComponent implements OnInit {
  public balance: number = 0;
  public portfolioCost: number = 0;
  public monthlyBudget: number = 0;
  public isMonthlyBudgetEnabled: boolean = false;
  public spentByMonth: number = 0;

  constructor(
    private totalBalanceService: TotalBalanceService,
  ) { }

  public ngOnInit(): void {
    combineLatest(
      [this.totalBalanceService.getMonthlyBudget(),
      this.totalBalanceService.getSpentByMonth()]
    ).subscribe(([ monthlyBudget, spentByMonth ]) => {
      this.isMonthlyBudgetEnabled = monthlyBudget.isEnabled;
      this.monthlyBudget = monthlyBudget.amount;
      this.spentByMonth = spentByMonth;

      this.balance = monthlyBudget.amount - spentByMonth;
    });
  }
}
