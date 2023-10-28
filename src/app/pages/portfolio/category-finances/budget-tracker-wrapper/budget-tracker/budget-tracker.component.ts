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

  public date: string = '';

  public expends: string[] = [];

  constructor() { }

  public ngOnInit(): void {
    moment.locale('uk');
    this.date = moment().format('dddd, D MMMM');
  }

  public save() {
  }
}
