import { Component } from '@angular/core';
import * as moment from 'moment';
import { MNY_WIDGET } from 'src/app/domain/default-widget-state.domain';
import { DialogService } from 'src/app/service/dialog.service';
import { ExpendBudgetService } from 'src/app/service/expend-budget.service';


@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.scss']
})
export class PortfolioComponent {
  public componentURL = MNY_WIDGET;

  constructor(
    private dialog: DialogService,
    private expendBudget: ExpendBudgetService) {
      const now = moment().format('')
      this.expendBudget.load(moment()).subscribe(task => {
        console.log(task, moment());
        
      }, err => console.log(err));
     }

  openBudgetTracker() {
    this.dialog.openBudgetTracker();
  }
}
