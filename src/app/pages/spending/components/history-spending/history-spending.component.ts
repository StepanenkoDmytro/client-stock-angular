import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
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
import { DateFormatPipe } from '../../../../core/UI/calendar/date-format.pipe';
import { combineLatest } from 'rxjs';
import { SpendingsService } from '../../../../service/spendings.service';


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

  public selectedCategories: Category[] = [];
  public spendingsGroupedByDate: Map<string, Spending[]> = new Map();
  public isAllCategoriesChecked: boolean = true; 
  public selectedCategoriesValue: string[] = [];

  constructor(
    private spendingsService: SpendingsService,
  ) { }

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
