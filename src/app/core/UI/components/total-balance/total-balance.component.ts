import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { SavingsService } from '../../../../service/savings.service';
import { ExpenseService } from '../../../../service/expense.service';
import { forkJoin } from 'rxjs';


@Component({
  selector: 'pgz-total-balance',
  standalone: true,
  imports: [],
  templateUrl: './total-balance.component.html',
  styleUrl: './total-balance.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
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
  ) { }

  public ngOnInit(): void {
    this.savingService.getCostOfAllAssets().subscribe(portfolioCost => {
      this.portfolioCost = portfolioCost;
    });

    this.expenseService.getMonthlyBudget().subscribe(budget => {
      this.monthlyBudget = budget;
    });

    this.expenseService.getSpentByMonth().subscribe(spent => {
      this.spentByMonth = spent;
      this.balance = this.monthlyBudget - this.spentByMonth;
    });

    // forkJoin({
    //   portfolioCost: this.savingService.getCostOfAllAssets(),
    //   monthlyBudget: this.expenseService.getMonthlyBudget(),
    //   spentByMonth: this.expenseService.getSpentByMonth()
    // }).subscribe(({ portfolioCost, monthlyBudget, spentByMonth }) => {
    //   this.portfolioCost = portfolioCost;
    //   this.monthlyBudget = monthlyBudget;
    //   this.spentByMonth = spentByMonth;
    //   this.balance = this.monthlyBudget - this.spentByMonth;
    // });
  }
}
