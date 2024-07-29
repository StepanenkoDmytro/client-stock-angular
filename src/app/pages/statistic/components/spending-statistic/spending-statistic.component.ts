import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { BarComponent } from '../../../../core/UI/components/charts/bar/bar.component';
import { SpendingsService } from '../../../../service/spendings.service';
import { HistorySpendingCardComponent } from '../../../spending/components/history-spending/history-spending-card/history-spending-card.component';
import { MultiLineComponent } from '../../../../core/UI/components/charts/multi-line/multi-line.component';
import { DonutComponent, IDonutData } from '../../../../core/UI/components/charts/donut/donut.component';
import { FormControl, FormGroup, FormsModule, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import {provideMomentDateAdapter} from '@angular/material-moment-adapter';
import moment from 'moment';
import { DateFormatPipe } from '../../../../core/UI/calendar/date-format.pipe';
import { ICategoryStatistic } from '../../model/SpendindStatistic';
import { switchMap } from 'rxjs';
import { SpendingCategoryHelperService } from '../../../../service/helpers/spending-category-helper.service';
import { IconComponent } from '../../../../core/UI/components/icon/icon.component';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { StatisticStateService } from '../../service/statistic-state.service';
import { Spending } from '../../../spending/model/Spending';
import { PieChartContainerComponent } from './pie-chart-container/pie-chart-container.component';
import { SpendingStatisticCardComponent } from './spending-statistic-card/spending-statistic-card.component';
import { Category } from '../../../../domain/category.domain';
import { MultiLineChartContainerComponent } from './multi-line-chart-container/multi-line-chart-container.component';


const UI_COMPONENTS = [
  DonutComponent,
  BarComponent,
  HistorySpendingCardComponent,
  IconComponent,
  MultiLineComponent,
  MultiLineChartContainerComponent,
  PieChartContainerComponent,
  SpendingStatisticCardComponent
];

const MATERIAL_MODULES = [
  MatTabsModule,
  MatExpansionModule,
  MatIconModule,
  MatButtonModule,
  MatDatepickerModule, 
  FormsModule, 
  ReactiveFormsModule,
];

@Component({
  selector: 'pgz-spending-statistic',
  standalone: true,
  imports: [...UI_COMPONENTS, ...MATERIAL_MODULES],
  templateUrl: './spending-statistic.component.html',
  styleUrl: './spending-statistic.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpendingStatisticComponent implements OnInit {

  public spendings: Spending[];
  public categoryStatisticForPeriod: ICategoryStatistic[];
  // public visibleCategoryStatisticForPeriod: ICategoryStatistic[];
  public chartType: 'pie' | 'multiline' = 'pie';
  public disabledCategories: Set<string> = new Set<string>();
  public filteredSpendings: Spending[] = [];

  constructor(
    private router: Router,
    private spendingsService: SpendingsService,
    private statisticStateHelper: StatisticStateService,
    private cdr: ChangeDetectorRef
  ) { }

  public ngOnInit(): void {
    this.spendingsService.init();
    this.spendingsService.getAllSpendings().subscribe(spendings => {
      // console.log(spendings);
      this.spendings = spendings;
      this.filteredSpendings = spendings;
      // this.cdr.detectChanges();
    });
  }

  public getCategoryStatisticData(categoryStatisticData: ICategoryStatistic[]) {
    console.log(this.disabledCategories.size === 0 || this.categoryStatisticForPeriod.length === 0);
    if(this.disabledCategories.size === 0 || this.categoryStatisticForPeriod.length === 0) {
      this.categoryStatisticForPeriod = categoryStatisticData;
      
    }
    this.cdr.detectChanges();
  }

  public toggleChart(): void {
    this.chartType = this.chartType === 'pie' ? 'multiline' : 'pie';
    this.disabledCategories = new Set();
    this.updateFilteredSpendings();
    this.cdr.detectChanges();
  }

  public isVisibleCard(category: Category): boolean {
    return !this.disabledCategories.has(category.id);
  }

  public onCardClick(category: Category): void {
    this.statisticStateHelper.addBreadCrumb(category);
    this.router.navigate(['/statistic/details', category.id]);
  }

  public toggleCategory(categoryId: string): void {
    if (this.disabledCategories.has(categoryId)) {
      this.disabledCategories.delete(categoryId);
    } else {
      this.disabledCategories.add(categoryId);
    }
    this.updateFilteredSpendings();
  }

  private updateFilteredSpendings(): void {
    if (this.disabledCategories.size === 0) {
      this.filteredSpendings = this.spendings;
    } else {
      this.filteredSpendings = this.spendings.filter(spending => {
        return !this.isSpendingInDisabledCategory(spending);
      });
    }
    this.cdr.detectChanges();
  }

  private isSpendingInDisabledCategory(spending: Spending): boolean {
    for (let categoryId of this.disabledCategories) {
      const category = this.categoryStatisticForPeriod.find(cat => cat.category.id === categoryId)?.category;
      if (category) {
        const spendingsByCategory = this.spendingsService.findSpendingsByCategoryIncludeChildren([spending], category);
        if (spendingsByCategory.length > 0) {
          return true;
        }
      }
    }
    return false;
  }
}
