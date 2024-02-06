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
import { CategorySelectComponent } from '../../../../core/UI/components/category-select/category-select.component';
import { Router } from '@angular/router';
import { EditStateSpendingService } from '../../service/edit-state-spending.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Spending } from '../../model/Spending';


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

  public editSpending: Spending = null;

  constructor(
    private spendingsService: SpendingsService,
    private router: Router,
    private editStateService: EditStateSpendingService,
    private readonly httpClient: HttpClient,
  ) { }

  public ngOnInit(): void {
    this.editSpending = this.editStateService.editStateSpending;

    if(!!this.editSpending) {
      this.selectedCategory = this.editSpending.category;
      this.nameOfProduct = this.editSpending.title;
      this.costOfProduct = this.editSpending.cost;
      this.date = this.editSpending.date;
    }
  }

  public saveSpending(): void {
    const editSpending = this.editStateService.editStateSpending;

    if(!!this.editSpending && editSpending.title !== '') {
      this.spendingsService.editSpending(this.editSpending);
    } else {
      const newExpense: Spending = new Spending(
        false,
        this.selectedCategory,
        this.nameOfProduct,
        this.costOfProduct,
        this.date,
      );
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
