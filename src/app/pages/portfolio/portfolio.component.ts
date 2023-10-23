import { ChangeDetectionStrategy, Component } from '@angular/core';
import * as moment from 'moment';
import { MNY_WIDGET } from 'src/app/domain/default-widget-state.domain';
import { IBudgetExpense } from 'src/app/domain/widget.domain';
import { DialogService } from 'src/app/service/dialog.service';
import { ExpendBudgetService } from 'src/app/service/expend-budget.service';


@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PortfolioComponent {
  public componentURL = MNY_WIDGET;
  public expenseArr: IBudgetExpense[] = [];
  //ngrx

  constructor(
    private dialog: DialogService,
    private expendBudget: ExpendBudgetService
  ) { }

  public openBudgetTracker() {
    this.dialog.openBudgetTracker().afterClosed().subscribe(result => {
      if (!result) {
        return;
      }

      this.expendBudget.load(moment()).subscribe(task => {
        this.expenseArr = task;
      }, err => console.log(err));

    });
  }
}
