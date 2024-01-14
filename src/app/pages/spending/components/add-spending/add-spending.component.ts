import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { ExpenseService } from '../../../../service/expense.service';
import { FormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import moment from 'moment';
import { Category } from '../../../../domain/category.domain';
import { ISpending } from '../../../../domain/spending.domain';
import { CategorySelectComponent } from '../../../../core/UI/components/category-select/category-select.component';


const UI_MODULES = [
  MatSelectModule,
  MatFormFieldModule,
  MatIconModule,
  MatButtonModule,
  MatInputModule,
  FormsModule,
  MatNativeDateModule,
  MatDatepickerModule,
  CategorySelectComponent,
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
  public categories: Category[] = Category.defaultList;
  public selectedCategory: Category = null /* this.data?.category */ || Category.default;
  public nameOfProduct: string = '';
  public costOfProduct: number = 0;
  public date: Date = moment().toDate();

  constructor(
    private expenseService: ExpenseService,
    // @Inject(MAT_BOTTOM_SHEET_DATA) public data: { category?: Category }
  ) { }

  public saveSpending(): void {
    const newExpense: ISpending = {
      category: this.selectedCategory,
      title: this.nameOfProduct,
      cost: this.costOfProduct,
      date: this.date,
    }
    
    this.expenseService.addSpending(newExpense);
  }
}
