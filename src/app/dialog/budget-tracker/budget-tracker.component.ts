import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import * as moment from 'moment';
import { IBudgetExpense } from 'src/app/domain/widget.domain';
import { ExpendBudgetService } from 'src/app/service/expend-budget.service';

@Component({
  selector: 'app-budget-tracker',
  templateUrl: './budget-tracker.component.html',
  styleUrls: ['./budget-tracker.component.scss']
})
export class BudgetTrackerComponent {

  public incomeCategory: string[] = ['Зарплата', 'Допомога', 'Бонуси', 'Пасивний'];
  public outlayCategory: string[] = ['Їжа', 'Саморозвиток', 'Транспорт', 'Одяг', 'Здоровʼя', 'Освіта', 'Подарунки'];

  public categoryCtrl: FormControl<string> = new FormControl(this.outlayCategory[0]);
  public costCtrl: FormControl<number> = new FormControl(0);
  public dateCtrl: FormControl<moment.Moment> = new FormControl(moment());
  public noteCtrl: FormControl<string> = new FormControl('');

  public expends: string[] = [];

  constructor(private expendBudget: ExpendBudgetService) { }

  public save() {
    const value = this.costCtrl.value;
    

    const form: IBudgetExpense = {
      date: this.dateCtrl.value,
      cost: this.costCtrl.value,
      category: this.categoryCtrl.value,
      note: this.noteCtrl.value,
    };
    // console.log(form);
    this.expendBudget.create(form);

    this.expendBudget.create(form).subscribe(task => {
      console.log(task);
      
    }, err => console.log(err));
  }
}
