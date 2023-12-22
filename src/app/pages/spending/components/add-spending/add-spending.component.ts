import { ChangeDetectionStrategy, Component } from '@angular/core';
import {MatSelectModule} from '@angular/material/select';
import {MatFormFieldModule} from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatInputModule} from '@angular/material/input';
import { ExpenseService } from '../../expense.service';
import { FormsModule } from '@angular/forms';
import {MatNativeDateModule} from '@angular/material/core';
import {MatDatepickerModule} from '@angular/material/datepicker';
import moment from 'moment';
import { ISpending } from '../../../../core/domain/spending.domain';


const UI_MODULES = [
  MatSelectModule,
  MatFormFieldModule,
  MatIconModule,
  MatButtonModule,
  MatInputModule,
  FormsModule,
  MatNativeDateModule,
  MatDatepickerModule,
];

@Component({
  selector: 'pgz-add-spending',
  standalone: true,
  imports: [...UI_MODULES],
  templateUrl: './add-spending.component.html',
  styleUrl: './add-spending.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddSpendingComponent {
  public categories: any[] = [
    {
      title: 'Car',
      icon: 'assets/expend/car.svg'
    },
    {
      title: 'Clothes',
      icon: 'assets/expend/clothes.svg'
    }
  ];
  public selectedCategory: any = this.categories[0];
  public nameOfProduct: string;
  public costOfProduct: number;
  public date: Date = moment().toDate();

  constructor(
    private expenseService: ExpenseService
  ) {}

  saveSpending() {
    const newExpense: ISpending = {
      icon: this.selectedCategory.icon,
      title: this.nameOfProduct,
      cost: this.costOfProduct,
      date: this.date,
    }
    this.expenseService.addSpending(newExpense);
  }
}
