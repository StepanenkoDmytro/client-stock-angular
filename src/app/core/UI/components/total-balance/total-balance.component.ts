import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
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

  @Input()
  public balance: number;
  public portfolioCost: number;
  public monthlyBudget: number;
  public spentByMonth: number;

  constructor(
    private totalBalanceService: TotalBalanceService,
    private cdr: ChangeDetectorRef
  ) { }

  public ngOnInit(): void {
    combineLatest(
      // this.savingService.getCostOfAllAssets(),
      this.totalBalanceService.getMonthlyBudget(),
      this.totalBalanceService.getSpentByMonth()
    ).subscribe(([ monthlyBudget, spentByMonth ]) => {
      // this.portfolioCost = portfolioCost;
      this.monthlyBudget = monthlyBudget;
      this.spentByMonth = spentByMonth;
      // this.balance = this.monthlyBudget - this.spentByMonth;
      this.cdr.detectChanges();
    });
  }
}
