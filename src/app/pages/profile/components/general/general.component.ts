import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
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
    private cdr: ChangeDetectorRef,
  ) { }

  public ngOnInit(): void {
    this.totalBalanceService.getMonthlyBudget().subscribe(monthlyBudget => {
      this.monthlyBudget = monthlyBudget;
    });
  }

  public changeMonthlyBudget(): void {
    const currentBudget = this.monthlyBudget.toString();
    console.log(currentBudget)

    const dialogRef = this.dialog.open(PopupMonthlyBudgetComponent, {
      maxWidth: '300px',
      maxHeight: '500px',
      data: { currentBudget },
    });

    dialogRef.afterClosed().subscribe((result: string) => {
      const monthlyBudget = parseInt(result);
      this.totalBalanceService.saveMonthlyBudget(monthlyBudget);
      this.cdr.detectChanges();
    });
  }
}
