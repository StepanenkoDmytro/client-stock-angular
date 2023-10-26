import { ChangeDetectorRef, Component } from '@angular/core';
import { EXPENSE_MOCK, INCOME_MOCK } from 'src/app/domain/mock.domain';
import { IBudgetExpense } from 'src/app/domain/widget.domain';
import { DateService } from 'src/app/service/date.service';
import { DialogService } from 'src/app/service/dialog.service';
import { ExpendBudgetService } from 'src/app/service/expend-budget.service';

@Component({
  selector: 'app-category-finances',
  templateUrl: './category-finances.component.html',
  styleUrls: ['./category-finances.component.scss']
})
export class CategoryFinancesComponent {
  public expenseArr: IBudgetExpense[] = [];
  public incomeMock = INCOME_MOCK;
  public expendMock = EXPENSE_MOCK;
  
  constructor(
    private dialog: DialogService,
    private expendBudget: ExpendBudgetService,
    private dateService: DateService,
    private cdr: ChangeDetectorRef,
  ) { }
  
  public openBudgetTracker() {
    const curDate = this.dateService.date.value;
    this.dialog.openBudgetTracker().afterClosed().subscribe(result => {
      if (!result) {
        return;
      }

      this.expendBudget.load(curDate).subscribe(task => {
        this.expenseArr = task;
        this.cdr.detectChanges();
      }, err => console.log(err));

    });
  }
}
