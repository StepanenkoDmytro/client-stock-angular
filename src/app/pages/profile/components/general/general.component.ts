import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { TotalBalanceService } from '../../../../core/UI/components/total-balance/total-balance.service';
import { PopupMonthlyBudgetComponent } from '../ui-settings/popup-monthly-budget/popup-monthly-budget.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'pgz-general',
  standalone: true,
  imports: [],
  templateUrl: './general.component.html',
  styleUrl: '../../profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeneralComponent implements OnInit {
  public monthlyBudget: number = 0;

  constructor(
    private totalBalanceService: TotalBalanceService,
    private dialog: MatDialog,
  ) { }

  public ngOnInit(): void {
    this.totalBalanceService.getMonthlyBudget().subscribe(monthlyBudget => {
      this.monthlyBudget = monthlyBudget;
    });
  }

  public changeMonthlyBudget(): void {
    const currMonthlyBudget = this.monthlyBudget;

    const dialogRef = this.dialog.open(PopupMonthlyBudgetComponent, {
      maxWidth: '300px',
      maxHeight: '500px',
      data: { currMonthlyBudget },
    });

    dialogRef.afterClosed().subscribe((result: number) => {
      this.totalBalanceService.saveMonthlyBudget(result);
    });
  }
}
