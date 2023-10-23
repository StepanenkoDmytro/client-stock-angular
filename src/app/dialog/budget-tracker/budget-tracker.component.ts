import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import * as moment from 'moment';
import { IBudgetExpense } from 'src/app/domain/widget.domain';
import { ExpendBudgetService } from 'src/app/service/expend-budget.service';

@Component({
  selector: 'app-budget-tracker',
  templateUrl: './budget-tracker.component.html',
  styleUrls: ['./budget-tracker.component.scss']
})
export class BudgetTrackerComponent implements OnInit {

  public incomeCategory: string[] = ['Зарплата', 'Допомога', 'Бонуси', 'Пасивний'];
  public outlayCategory: string[] = ['Їжа', 'Саморозвиток', 'Транспорт', 'Одяг', 'Здоровʼя', 'Освіта', 'Подарунки'];

  public categoryCtrl: FormControl<string> = new FormControl(this.outlayCategory[0]);
  public costCtrl: FormControl<number> = new FormControl(0);
  public dateCtrl: FormControl<string> = new FormControl('');
  public noteCtrl: FormControl<string> = new FormControl('');

  public expends: string[] = [];

  constructor(
    private expendBudget: ExpendBudgetService,
    private dialogRef: MatDialogRef<any>) { 
    // this.dateCtrl.setValue(moment());
    // console.log(this.dateCtrl.value);
  }

  public ngOnInit(): void {
    const currentDate = moment().format('YYYY-MM-DD'); 
    this.dateCtrl.setValue(currentDate);
    
  }

  public save() {
    const form: IBudgetExpense = {
      date: this.dateCtrl.value,
      cost: this.costCtrl.value,
      category: this.categoryCtrl.value,
      note: this.noteCtrl.value,
    };

    this.expendBudget.create(form).subscribe(task => {
      console.log(task);
      this.dialogRef.close(task);
    }, err => console.log(err));
  }
}
