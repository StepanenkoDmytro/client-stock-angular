import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { ExpenseService } from '../../../../service/expense.service';
import { FormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { CATEGORY_SPENDING, ICategorySpending, ISpending } from '../../../../domain/spending.domain';
import { MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import moment from 'moment';


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
  public categories: ICategorySpending[] = CATEGORY_SPENDING;
  public selectedCategory: ICategorySpending;
  public nameOfProduct: string;
  public costOfProduct: number;
  public date: Date = moment().toDate();

  constructor(
    private expenseService: ExpenseService,
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: { category?: ICategorySpending }
  ) {
    const isCategoryPreselected: boolean = !!(this.data && this.data.category);
    const emptyCategory: ICategorySpending = { title: '', icon: '' };

    this.selectedCategory = isCategoryPreselected ? this.data.category : emptyCategory;
  }

  public saveSpending(): void {
    const newExpense: ISpending = {
      icon: this.selectedCategory.icon,
      title: this.nameOfProduct,
      cost: this.costOfProduct,
      date: this.date,
    }  
    this.expenseService.addSpending(newExpense);
  }
}
