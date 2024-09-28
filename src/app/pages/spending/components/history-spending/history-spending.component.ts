import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import moment from 'moment';
import { ICategorizedSpendings } from '../../../../domain/spending.domain';
import { HistorySpendingCardComponent } from './history-spending-card/history-spending-card.component';
import { Spending } from '../../model/Spending';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Category } from '../../../../domain/category.domain';
import { MatButtonModule } from '@angular/material/button';


const UI_COMPONENTS = [
  HistorySpendingCardComponent,
];

const MATERIAL_MODULES = [
  MatIconModule,
  FormsModule, 
  MatFormFieldModule, 
  MatSelectModule, 
  MatCheckboxModule,
  MatInputModule,
  MatButtonModule
];

@Component({
  selector: 'pgz-history-spending',
  standalone: true,
  imports: [...UI_COMPONENTS, ...MATERIAL_MODULES],
  templateUrl: './history-spending.component.html',
  styleUrl: './history-spending.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistorySpendingComponent implements OnInit {
  
  @Input()
  public set spendings(value: Spending[]) {
    this.categoriesSpendings = this.categorizeSpendings([...value]);
  }

  @Input()
  public categories: Category[];

  public selectedCategories: Category[] = [];
  public categoriesSpendings: ICategorizedSpendings;
  public isAllCategoriesChecked: boolean = true; 
  public selectedCategoriesValue: string[] = [];

  private allCategoriesValue: string = 'All categories';

  ngOnInit(): void {
    this.selectAllCategories();
  }

  public toggleAllCategories(): void {
    if (this.isAllCategoriesChecked) {
      this.selectedCategories = [];
    } else {
      this.selectAllCategories();
    }
    this.isAllCategoriesChecked = !this.isAllCategoriesChecked;
  }

  private selectAllCategories(): void {
    this.selectedCategories = [...this.categories];
    this.isAllCategoriesChecked = true;
  }

  get displayValue(): string {
    const isAllCategoriesSelected = this.selectedCategories.map(category => category.title).includes(this.allCategoriesValue)
    if (isAllCategoriesSelected) {
      return 'All selected';
    }
    return this.selectedCategoriesValue.join(', ');
  }

  public onCategoryChange(category: Category, checked: boolean): void {
    if (checked) {
      this.selectedCategories.push(category);
    } else {
      const index = this.selectedCategories.findIndex(c => c.id === category.id);
      if (index > -1) {
        this.selectedCategories.splice(index, 1);
      }
    }

    this.isAllCategoriesChecked = this.selectedCategories.length === this.categories.length;
  }

  private categorizeSpendings(spendings: Spending[]): ICategorizedSpendings {
    const today = moment().startOf('day');

    const lastWeek = moment().subtract(7, 'days').startOf('day');

    const categorizedSpendings: ICategorizedSpendings = {
      today: [],
      lastWeek: [],
      month: [],
    };

    spendings.forEach(spending => {
      const spendingDate = moment(spending.date);

      if (spendingDate.isSame(today, 'day')) {
        categorizedSpendings.today.push(spending);
      } else if (spendingDate.isAfter(lastWeek, 'day')) {
        categorizedSpendings.lastWeek.push(spending);
      } else {
        categorizedSpendings.month.push(spending);
      }
    });
    
    return categorizedSpendings;
  }
}
