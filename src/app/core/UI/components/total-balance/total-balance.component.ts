import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { SavingsService } from '../../../../service/savings.service';
import { ExpenseService } from '../../../../service/expense.service';
import { MoneyPipe } from '../../../../pipe/money.pipe';
import { combineLatest } from 'rxjs';


@Component({
  selector: 'pgz-total-balance',
  standalone: true,
  imports: [MoneyPipe],
  templateUrl: './total-balance.component.html',
  styleUrl: './total-balance.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TotalBalanceComponent implements OnInit {

  @Input()
  public balance: number;
  public portfolioCost: number;
  public monthlyBudget: number;
  public spentByMonth: number;

  constructor(
    private savingService: SavingsService,
    private expenseService: ExpenseService,
    private cdr: ChangeDetectorRef
  ) { }

  public ngOnInit(): void {
    combineLatest(
      this.savingService.getCostOfAllAssets(),
      this.expenseService.getMonthlyBudget(),
      this.expenseService.getSpentByMonth()
    ).subscribe(([ portfolioCost, monthlyBudget, spentByMonth ]) => {
      this.portfolioCost = portfolioCost;
      this.monthlyBudget = monthlyBudget;
      this.spentByMonth = spentByMonth;
      this.balance = this.monthlyBudget - this.spentByMonth;
      this.cdr.detectChanges();
    });
  }
}
