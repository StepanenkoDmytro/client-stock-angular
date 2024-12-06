import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MoneyPipe } from '../../../../pipe/money.pipe';
import { TotalBalanceService } from '../../../../core/UI/components/total-balance/total-balance.service';
import { combineLatest } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { IconComponent } from '../../../../core/UI/components/icon/icon.component';
import { Router, RouterModule } from '@angular/router';

const MATERIAL_MODULES = [
  MatExpansionModule,
  MatFormFieldModule,
  MatDatepickerModule,
  MatSlideToggleModule,
  ReactiveFormsModule,
  MatCheckboxModule,
  MatRadioModule,
  CommonModule
];

@Component({
  selector: 'pgz-total-balance-spending',
  standalone: true,
  imports: [IconComponent, ...MATERIAL_MODULES, MoneyPipe, RouterModule],
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
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  public ngOnInit(): void {
    combineLatest(
      [this.totalBalanceService.getMonthlyBudget(),
      this.totalBalanceService.getSpentByMonth()]
    ).subscribe(([ monthlyBudget, spentByMonth ]) => {
      this.monthlyBudget = monthlyBudget;
      this.spentByMonth = spentByMonth;

      this.balance = monthlyBudget - spentByMonth;
      this.cdr.markForCheck();
    });
  }

  public routeToStatisticPage(): void {
    this.router.navigate(['/spending/statistic']);
  }
}
