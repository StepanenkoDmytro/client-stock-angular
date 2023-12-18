import { Component } from '@angular/core';

@Component({
  selector: 'app-day-view',
  templateUrl: './day-view.component.html',
  styleUrls: ['./day-view.component.scss']
})
export class DayViewComponent {
  // public expenseArr: IBudgetExpense[] = [];
  // public currentDate: string = '';

  // public incomeMock = INCOME_MOCK;
  // public expendMock = EXPENSE_MOCK;
  // //ngrx

  // constructor(
  //   private dialog: DialogService,
  //   private expendBudget: ExpendBudgetService,
  //   private dateService: DateService,
  //   private cdr: ChangeDetectorRef,
  // ) { }

  // public ngOnInit(): void {

  //   this.dateService.date.pipe(
  //     tap(date => this.currentDate = date.format('DD MMM')),
  //     switchMap(value => this.expendBudget.load(value))
  //   ).subscribe(tasks => {
  //     this.expenseArr = tasks;
  //     this.cdr.detectChanges();
  //   });

  // }

  // public openBudgetTracker() {
  //   // const curDate = this.dateService.date.value;
  //   // this.dialog.openBudgetTracker().afterClosed().subscribe(result => {
  //   //   if (!result) {
  //   //     return;
  //   //   }

  //   //   this.expendBudget.load(curDate).subscribe(task => {
  //   //     this.expenseArr = task;
  //   //     this.cdr.detectChanges();
  //   //   }, err => console.log(err));

  //   // });
  // }
}
