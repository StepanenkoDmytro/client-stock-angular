import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MoneyPipe } from '../../../../pipe/money.pipe';
import { combineLatest } from 'rxjs';
import { TotalBalanceService } from './total-balance.service';
import { SavingsService } from '../../../../service/savings.service';


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
  public spentByMonth: number = 0;

  constructor(
    private savingService: SavingsService,
    private totalBalanceService: TotalBalanceService,
  ) { }

  public ngOnInit(): void {
    combineLatest(
      // this.savingService.getCostOfAllAssets(),
      [this.totalBalanceService.getMonthlyBudget(),
      this.totalBalanceService.getSpentByMonth()]
    ).subscribe(([ monthlyBudget, spentByMonth ]) => {
      // this.portfolioCost = portfolioCost;
      this.monthlyBudget = monthlyBudget;
      this.spentByMonth = spentByMonth;

      this.balance = monthlyBudget - spentByMonth;
    });
  }
}
