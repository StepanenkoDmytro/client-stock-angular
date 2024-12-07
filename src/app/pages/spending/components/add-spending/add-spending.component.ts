import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
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
import { Router } from '@angular/router';
import { EditStateService } from '../../service/edit-state.service';
import { HttpClientModule } from '@angular/common/http';
import { Spending } from '../../model/Spending';
import { MoneyDirective } from '../../../../directive/money.directive';
import { ArrowBackComponent } from '../../../../core/UI/components/arrow-back/arrow-back.component';
import { AcceptBtnComponent } from '../../../../core/UI/components/accept-btn/accept-btn.component';
import { CategorySelectorComponent } from './category-select/category-select.component';
import { FormFieldComponent } from '../../../../core/UI/components/form-field/form-field.component';
import { PrevRouteComponent } from '../../../../core/UI/components/prev-route/prev-route.component';


const UI_MODULES = [
  MoneyDirective,
  ArrowBackComponent,
  AcceptBtnComponent,
  CategorySelectorComponent,
  FormFieldComponent,
  PrevRouteComponent
];

const MATERIAL_MODULES = [
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
  imports: [...UI_MODULES, ...MATERIAL_MODULES, HttpClientModule],
  templateUrl: './add-spending.component.html',
  styleUrl: './add-spending.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddSpendingComponent implements OnInit, OnDestroy {

  public categories: Category[];
  public selectedCategory: Category;
  public commentOfProduct: string = '';
  public costOfProduct: string = '';
  public date: Date = moment().toDate();

  public editSpending: Spending = null;

  constructor(
    private spendingsService: SpendingsService,
    private router: Router,
    private editStateSpendingService: EditStateService,
    private cdr: ChangeDetectorRef
  ) { }

  public async ngOnInit(): Promise<void> {
    this.spendingsService.init();
    this.spendingsService.getAllCategories().subscribe(categories => {
      this.categories = categories[1].children;

      //TODO: or unselected?
      this.selectedCategory = this.categories.find(category => category.title === 'Other');

      if(this.editSpending && this.editSpending.category) {
        this.selectedCategory = this.editSpending.category;
      }
    });

    this.editSpending = this.editStateSpendingService.editStateSpending;

    if(!!this.editSpending) {
      this.selectedCategory = this.editSpending.category;
      this.commentOfProduct = this.editSpending.comment;
      this.costOfProduct = this.editSpending.cost.toString();
      this.date = this.editSpending.date;
    }
  }

  public selectCategory(selectedCategory: Category): void {
    if(selectedCategory) {
      this.selectedCategory = selectedCategory;
    }
  }

  get canSave(): boolean {
    if(this.selectedCategory !== null && this.costOfProduct !== null && parseInt(this.costOfProduct) > 0 ) {
      return true;
    }
    return false;
  }


  public save(): void {
    this.saveSpending();
    this.prevRoute();
  }

  private saveSpending(): void {
    if(!!this.editSpending) {
      const editSpending = this.buildNewSpending(this.editSpending.id);
      this.spendingsService.editSpending(editSpending);
      return;
    } 
    
    const newSpending = this.buildNewSpending();
    this.spendingsService.addSpending(newSpending);
  }

  private buildNewSpending(id?: string): Spending {
    const costOfProduct = parseFloat(this.costOfProduct);
    return new Spending(
      false,
      this.selectedCategory,
      this.commentOfProduct,
      costOfProduct,
      this.date,
      id
    );
  }

  public prevRoute(): void {
    if(this.editStateSpendingService.prevRoute) {
      this.router.navigate([this.editStateSpendingService.prevRoute.path]);
    } else {
      this.router.navigate(['spending']);
    }
  }

  public ngOnDestroy(): void {
    this.editStateSpendingService.destroyEditState();
  }
}
