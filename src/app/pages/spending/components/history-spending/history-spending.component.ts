import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import moment from 'moment';
import { HistorySpendingCardComponent } from './history-spending-card/history-spending-card.component';
import { Spending } from '../../model/Spending';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Category } from '../../../../domain/category.domain';
import { MatButtonModule } from '@angular/material/button';
import {MatSidenavModule} from '@angular/material/sidenav';
import { DateFormatPipe } from '../../../../pipe/date-format.pipe';
import { combineLatest } from 'rxjs';
import { SpendingsService } from '../../../../service/spendings.service';
import { EmptyStateComponent } from '../../../../core/UI/components/empty-state/empty-state.component';
import { FilterWrapperComponent } from '../../../../core/UI/components/filter-wrapper/filter-wrapper.component';
import { IconComponent } from '../../../../core/UI/components/icon/icon.component';


const UI_COMPONENTS = [
  HistorySpendingCardComponent,
  EmptyStateComponent,
  FilterWrapperComponent,
  IconComponent
];

const MATERIAL_MODULES = [
  MatIconModule,
  FormsModule, 
  MatFormFieldModule, 
  MatSelectModule, 
  MatCheckboxModule,
  MatInputModule,
  MatButtonModule,
  MatSidenavModule,
];

@Component({
  selector: 'pgz-history-spending',
  standalone: true,
  imports: [...UI_COMPONENTS, ...MATERIAL_MODULES, DateFormatPipe],
  templateUrl: './history-spending.component.html',
  styleUrl: './history-spending.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistorySpendingComponent implements OnInit {
  private spendings: Spending[] = [];
  public categories: Category[];

  get categoriesForFilter(): { id: string; title: string }[] {
    return this.categories.map(category => ({
      id: category.id,
      title: category.title,
    }));
  }

  public selectedCategories: Category[] = [];
  public spendingsGroupedByDate: Map<string, Spending[]> = new Map();
  public isAllCategoriesChecked: boolean = true; 
  public selectedCategoriesValue: string[] = [];

  constructor(
    private spendingsService: SpendingsService,
    private cdr: ChangeDetectorRef
  ) { }

  get selectedCategoriesSet(): Set<string> {
    return new Set(this.selectedCategories.map(category => category.id));
  }

  public ngOnInit(): void {
    combineLatest([
      this.spendingsService.loadByCurrentMonth(),
      this.spendingsService.getAllCategories()
    ]).subscribe( async ([spendings, categories]) => {

      this.spendings = [...spendings];
      this.spendingsGroupedByDate = this.groupSpendingsByDate([...spendings]);
      this.categories = categories[1].children;
      
      this.selectedCategories = [...this.categories];
      this.isAllCategoriesChecked = true;
    });
    
  }

  public toggleAllCategories(): void {
    this.isAllCategoriesChecked = !this.isAllCategoriesChecked;
    this.selectedCategories = this.isAllCategoriesChecked ? [...this.categories] : [];
    this.spendingsGroupedByDate = this.groupSpendingsByDate([...this.spendings]);
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
    this.spendingsGroupedByDate = this.groupSpendingsByDate([...this.spendings]);
  }

  public updateSelectedCategories(selectedCategories: Set<string>): void {
    // if (checked) {
    //   this.selectedCategories.push(category);
    // } else {
    //   const index = this.selectedCategories.findIndex(c => c.id === category.id);
    //   if (index > -1) {
    //     this.selectedCategories.splice(index, 1);
    //   }
    // }
    // debugger;

    this.selectedCategories = this.selectedCategories.filter(selectedCategory => selectedCategories.has(selectedCategory.id));
    // this.selectedCategories = Array.from(selectedCategories) as Category[];

    this.isAllCategoriesChecked = this.selectedCategories.length === this.categories.length;
    this.spendingsGroupedByDate = this.groupSpendingsByDate([...this.spendings]);
    this.cdr.detectChanges();
  }

  /**
   * Friendly day-group label for the History list per M5.6 PR5 design
   * (design/spending/01-spending-mobile-redesign.svg Frame 2):
   *   today     → "TODAY · 22 MAY"
   *   yesterday → "YESTERDAY · 21 MAY"
   *   earlier   → "MON · 19 MAY"
   *
   * <p>`dateKey` arrives in `"D MMMM YYYY"` shape (e.g. "22 May 2026")
   * from {@link #groupSpendingsByDate}; reparse via moment for the
   * relative comparison + final formatting.
   */
  public formatDayLabel(dateKey: string): string {
    const m = moment(dateKey, 'D MMMM YYYY');
    if (!m.isValid()) return dateKey;
    const today = moment().startOf('day');
    const yest = today.clone().subtract(1, 'day');
    const day = m.clone().startOf('day');
    const dateSuffix = m.format('D MMM').toUpperCase();
    if (day.isSame(today)) return `TODAY · ${dateSuffix}`;
    if (day.isSame(yest))  return `YESTERDAY · ${dateSuffix}`;
    return `${m.format('ddd').toUpperCase()} · ${dateSuffix}`;
  }

  private groupSpendingsByDate(spendings: Spending[]): Map<string, Spending[]> {
    const spendingsGroupedByDate = new Map<string, Spending[]>();
  
    spendings.sort((a, b) => moment(b.date).diff(moment(a.date)));
  
    const filteredSpendings = spendings.filter(spending =>
      this.isAllCategoriesChecked || this.selectedCategories.some(category => category.id === spending.category.id)
    );
  
    filteredSpendings.forEach(spending => {
      const dateKey = moment(spending.date).format('D MMMM YYYY');
  
      if (!spendingsGroupedByDate.has(dateKey)) {
        spendingsGroupedByDate.set(dateKey, []);
      }
  
      spendingsGroupedByDate.get(dateKey)!.push(spending);
    });
  
    return spendingsGroupedByDate;
  }

}
