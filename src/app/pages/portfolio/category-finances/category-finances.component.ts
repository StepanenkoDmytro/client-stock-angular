import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { EXPENSE_MOCK, INCOME_MOCK } from 'src/app/domain/mock.domain';
import { IBudgetExpense } from 'src/app/domain/widget.domain';

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
    private router: Router,
  ) { }
  
  public openBudgetTracker() {
    console.log('/money-tracker');
    
    this.router.navigate(['/money-tracker']);
  }
}
