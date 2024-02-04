import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { SpendingsService } from '../../../../service/spendings.service';
import { FormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import moment from 'moment';
import { Category } from '../../../../domain/category.domain';
import { ISpending } from '../../../../domain/spending.domain';
import { CategorySelectComponent } from '../../../../core/UI/components/category-select/category-select.component';
import { Router } from '@angular/router';
import { EditStateSpendingService } from '../../service/edit-state-spending.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';


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
  imports: [...UI_MODULES, HttpClientModule],
  templateUrl: './add-spending.component.html',
  styleUrl: './add-spending.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddSpendingComponent implements OnInit, OnDestroy {
  public categories: Category[] = Category.defaultList;
  public selectedCategory: Category = null /* this.data?.category */ || Category.default;
  public nameOfProduct: string = '';
  public costOfProduct: number = 0;
  public date: Date = moment().toDate();

  public isEditSpending: boolean = false;

  constructor(
    private spendingsService: SpendingsService,
    private router: Router,
    private editStateService: EditStateSpendingService,
    private readonly httpClient: HttpClient,
  ) { }

  public ngOnInit(): void {
    const editSpending = this.editStateService.editStateSpending;
    this.isEditSpending = !!editSpending;

    if(this.isEditSpending) {
      this.selectedCategory = editSpending.category;
      this.nameOfProduct = editSpending.title;
      this.costOfProduct = editSpending.cost;
      this.date = editSpending.date;
    }
  }

  public saveSpending(): void {
    const newExpense: ISpending = {
      category: this.selectedCategory,
      title: this.nameOfProduct,
      cost: this.costOfProduct,
      date: this.date,
    }

    const editSpending = this.editStateService.editStateSpending;

    if(this.isEditSpending && editSpending.title !== '') {
      newExpense.id = editSpending.id;
      this.spendingsService.editSpending(newExpense);
    } else {
      this.spendingsService.addSpending(newExpense);
    }
    this.prevRoute();
  }

  public prevRoute(): void {
    if(this.editStateService.prevRoute) {
      this.router.navigate([this.editStateService.prevRoute.path]);
    } else {
      this.router.navigate(['spending']);
    }
  }

  public ngOnDestroy(): void {
    this.editStateService.destroyEditStateSpending();
  }
}
