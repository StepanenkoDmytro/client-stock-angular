import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { SavingsService } from '../../../../service/savings.service';
import { ExpenseService } from '../../../../service/expense.service';


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
  public balance: string | number = 100000;
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

    this.monthlyBudget = this.expenseService.monthlyBudget;
    this.expenseService.getSpentBymonth().subscribe(spent => {
      this.spentByMonth = spent;
    })
    
  }
}
