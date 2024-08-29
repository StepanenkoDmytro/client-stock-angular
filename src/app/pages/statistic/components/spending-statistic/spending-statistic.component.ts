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
import { RangeControllerComponent } from './range-controller/range-controller.component';


const UI_COMPONENTS = [
  DonutComponent,
  BarComponent,
  HistorySpendingCardComponent,
  IconComponent,
  MultiLineComponent,
  MultiLineChartContainerComponent,
  PieChartContainerComponent,
  SpendingStatisticCardComponent,
  RangeControllerComponent
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

  public chartType: 'pie' | 'multiline' = 'pie';
  public isCompareEnabled: boolean = false;

  public isAscSort : boolean = true;
  public disabledCategories: Set<string> = new Set<string>();
  public filteredSpendings: Spending[] = [];

  public spendings: Spending[] = [];
  public categoryStatisticForPeriod: ICategoryStatistic[] = [];
  public compareCategoryStatisticForChart: ICategoryStatistic[] = [];
  public spendingsForMultiLineChart: Spending[] = [];
  public compareSpendingsForMultiLineChart: Spending[] = [];
  
  constructor(
    private router: Router,
    private spendingsService: SpendingsService,
    private statisticStateHelper: StatisticStateService,
    private spendingsHelperService: SpendingCategoryHelperService,
    private cdr: ChangeDetectorRef
  ) { }

  public ngOnInit(): void {
    
    this.spendingsService.init();
    this.spendingsService.getAllSpendings().subscribe(spendings => {
      
      this.spendings = spendings;
      this.filteredSpendings = spendings;

      this.cdr.detectChanges();
    });
  }

  public getCategoryStatisticData(categoryStatisticData: ICategoryStatistic[]) {
    if(this.disabledCategories.size === 0 || this.categoryStatisticForPeriod.length === 0) {
      this.categoryStatisticForPeriod = categoryStatisticData.sort((a,b) => b.value - a.value);
      
    }
    this.cdr.detectChanges();
  }

  public toggleChart(): void {
    this.chartType = this.chartType === 'pie' ? 'multiline' : 'pie';
    this.disabledCategories = new Set();
    this.updateFilteredSpendings();
    this.cdr.detectChanges();
  }

  public async onRangeChange(range: {
    startDate: moment.Moment,
    endDate: moment.Moment,
    isCompareEnabled: boolean,
    compareStartDate?: moment.Moment,
    compareEndDate?: moment.Moment
  }): Promise<void> {
    const spendingsByRange: Spending[] = this.spendingsHelperService.getSpendingsByRange(range.startDate, range.endDate, this.filteredSpendings);
    this.categoryStatisticForPeriod = (await this.spendingsHelperService.calculateCategoryStatistic(spendingsByRange)).sort((a,b) => b.value - a.value);
    this.sortCategoryStatistic();

    this.isCompareEnabled = range.isCompareEnabled;

    // if(range.isCompareEnabled) {
      const compareSpendingsByRange: Spending[] = this.spendingsHelperService.getSpendingsByRange(range.compareStartDate, range.compareEndDate, this.filteredSpendings);
      // if(this.chartType === 'pie') {
        this.compareCategoryStatisticForChart = await this.spendingsHelperService.calculateCategoryStatistic(compareSpendingsByRange);
      // }
      
      // if(this.chartType === 'multiline') {
        // console.log(compareSpendingsByRange);
        this.spendingsForMultiLineChart = spendingsByRange;
        this.compareSpendingsForMultiLineChart = this.spendingsHelperService.getSpendingsByRange(range.compareStartDate, range.compareEndDate, compareSpendingsByRange);
      // }
    // }
    // console.log('here')
    this.cdr.detectChanges();
  }

  public sortCategoryStatistic(): void {
    this.categoryStatisticForPeriod.sort((a, b) => {
      const isADisabled = this.disabledCategories.has(a.category.id);
      const isBDisabled = this.disabledCategories.has(b.category.id);

      const aIsZero = a.value === 0;
      const bIsZero = b.value === 0;
     
      if (aIsZero && !bIsZero) {
        return 1;
      } else if (!aIsZero && bIsZero) {
          return -1;
      } else if (aIsZero && bIsZero) {
          return 0;
      }

      if (isADisabled && !isBDisabled) {
        return 1;
      } else if (!isADisabled && isBDisabled) {
          return -1;
      }

      if (isADisabled && !isBDisabled) {
        return this.isAscSort ? 1 : -1;
      } else if (!isADisabled && isBDisabled) {
        return this.isAscSort ? -1 : 1;
      }

      if(this.isAscSort) {
        return b.value - a.value;
      } else {
        return a.value - b.value;
      }

      return 0;
    });
  }

  public changeSortBy(): void {
    this.isAscSort = !this.isAscSort;
    this.sortCategoryStatistic();
    this.cdr.detectChanges();
  }

  public isVisibleCategory(category: Category): boolean {
    return !this.disabledCategories.has(category.id);
  }

  public toggleCategory(categoryId: string): void {
    if (this.disabledCategories.has(categoryId)) {
      this.disabledCategories.delete(categoryId);
    } else {
      this.disabledCategories.add(categoryId);
    }
    this.updateFilteredSpendings();
    this.sortCategoryStatistic();

    this.cdr.detectChanges();
  }

  public onCardClick(category: Category): void {
    this.statisticStateHelper.addBreadCrumb(category);
    this.router.navigate(['/statistic/details', category.id]);
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
