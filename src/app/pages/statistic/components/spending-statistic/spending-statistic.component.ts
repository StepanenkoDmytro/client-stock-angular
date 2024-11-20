import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { BarComponent } from '../../../../core/UI/components/charts/bar/bar.component';
import { SpendingsService } from '../../../../service/spendings.service';
import { HistorySpendingCardComponent } from '../../../spending/components/history-spending/history-spending-card/history-spending-card.component';
import { MultiLineComponent } from '../../../../core/UI/components/charts/multi-line/multi-line.component';
import { DonutComponent } from '../../../../core/UI/components/charts/donut/donut.component';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import moment from 'moment';
import { ICategoryStatistic, RangeForm, initializeFormGroup } from '../../model/SpendindStatistic';
import { Subscription, combineLatest, switchMap } from 'rxjs';
import { SpendingCategoryHelperService } from '../../../../service/helpers/spending-category-helper.service';
import { IconComponent } from '../../../../core/UI/components/icon/icon.component';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { StatisticStateService } from '../../service/statistic-state.service';
import { Spending } from '../../../spending/model/Spending';
import { PieChartContainerComponent } from './pie-chart-container/pie-chart-container.component';
import { SpendingStatisticCardComponent } from './spending-statistic-card/spending-statistic-card.component';
import { Category } from '../../../../domain/category.domain';
import { MultiLineChartContainerComponent } from './multi-line-chart-container/multi-line-chart-container.component';
import { RangeControllerComponent } from './range-controller/range-controller.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { PrevRouteComponent } from '../prev-route/prev-route.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { DateFormatPipe } from '../../../../pipe/date-format.pipe';


const UI_COMPONENTS = [
  DonutComponent,
  BarComponent,
  HistorySpendingCardComponent,
  IconComponent,
  MultiLineComponent,
  MultiLineChartContainerComponent,
  PieChartContainerComponent,
  SpendingStatisticCardComponent,
  RangeControllerComponent,
  PrevRouteComponent
];

const MATERIAL_MODULES = [
  MatFormFieldModule,
  MatSelectModule,
  MatTabsModule,
  
  MatIconModule,
  MatButtonModule,
  MatDatepickerModule, 
  FormsModule, 
  ReactiveFormsModule,
  MatCheckboxModule
];

@Component({
  selector: 'pgz-spending-statistic',
  standalone: true,
  imports: [...UI_COMPONENTS, ...MATERIAL_MODULES, DateFormatPipe],
  templateUrl: './spending-statistic.component.html',
  styleUrl: './spending-statistic.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpendingStatisticComponent implements OnInit, OnDestroy {
  public currCategory: Category | null;

  public chartTypeCtrl: 'pie' | 'multiline' = 'multiline';
  public isCompareEnabled: boolean = false;

  public isAscSort : boolean = true;
  public disabledCategories: Set<string> = new Set<string>();
  public filteredSpendings: Spending[] = [];

  public spendings: Spending[] = [];
  public formRange: FormGroup<RangeForm>;
  public categoryStatisticForPeriod: ICategoryStatistic[] = [];
  public categoryStatisticForPieChart: ICategoryStatistic[] = [];
  public compareCategoryStatisticForPieChart: ICategoryStatistic[] = [];
  public spendingsForMultiLineChart: Spending[] = [];
  public compareSpendingsForMultiLineChart: Spending[] = [];
  
  public subscription: Subscription;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private spendingsService: SpendingsService,
    private statisticStateHelper: StatisticStateService,
    private spendingsHelperService: SpendingCategoryHelperService,
    private cdr: ChangeDetectorRef
  ) { }

  public ngOnInit(): void {
    this.spendingsService.init();
    this.formRange = initializeFormGroup();

    this.subscription = combineLatest([
      this.route.paramMap,
      this.spendingsService.getAllSpendings(),
      this.formRange.valueChanges
    ]).pipe(
      switchMap(async ([paramMap, spendings]) => {
        const categoryId = paramMap.get('id');
  
        if (categoryId) {
          this.currCategory = await this.spendingsService.findCategoryById(categoryId);
        }
  
        this.spendings = spendings;
        this.filteredSpendings = this.spendings;
  
        return this.spendings;
      })
    ).subscribe(() => {
      this.updateComponentData();
    });
  }

  public updateComponentData(): void {
    this.updateFilteredSpendings();
    this.setCategoryStatistic();

    this.cdr.markForCheck();
  }

  public onRangeChange(range: {
    startDate: moment.Moment,
    endDate: moment.Moment,
    compareStartDate?: moment.Moment,
    compareEndDate?: moment.Moment
  }): void {
    this.updateFormGroup(range);
  }

  public allCategoriesVisible(): void {
    this.disabledCategories = new Set();
    this.updateFilteredSpendings();
    this.setCategoryStatistic();

    this.cdr.markForCheck();
  }

  public changeSortBy(): void {
    this.isAscSort = !this.isAscSort;
    this.sortCategoryStatistic();
    this.cdr.detectChanges();
  }

  public isVisibleCategory(category: Category): boolean {
    return !this.disabledCategories.has(category.id);
  }

  public toogleCompare(): void {
    this.isCompareEnabled = !this.isCompareEnabled;
    this.cdr.markForCheck();
  }

  public toggleCategory(categoryId: string): void {
    if (this.disabledCategories.has(categoryId)) {
      this.disabledCategories.delete(categoryId);
    } else {
      this.disabledCategories.add(categoryId);
    }

    this.setChartsData();
  }

  public onCardClick(category: Category): void {
    if(category.title === 'Other') {
      return;
    }

    this.statisticStateHelper.addBreadCrumb(category);
    this.router.navigate(['/statistic/details', category.id]);
  }

  public getCompareDataForCard(categoryId: string): ICategoryStatistic {
    return this.compareCategoryStatisticForPieChart.find(categoryStat => categoryStat.category.id === categoryId);
  }

  private async setCategoryStatistic(): Promise<void> {
    if(this.currCategory) {
      this.categoryStatisticForPeriod = this.spendingsHelperService.calculateCategoryStatisticByCategory(this.filteredSpendings, this.currCategory);
     } else {
      this.categoryStatisticForPeriod = (await this.spendingsHelperService.calculateCategoryStatistic(this.filteredSpendings));
    }

    this.setChartsData();
  }

  public getCompareCategoryStatisticForPieChart(): ICategoryStatistic[] {
    return this.compareCategoryStatisticForPieChart.filter(categoryStat => !this.disabledCategories.has(categoryStat.category.id))
  } 

  public ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private async setChartsData(): Promise<void> {
    const compareSpendingsByRange: Spending[] = this.spendingsHelperService.getSpendingsByRange(
      this.formRange.controls.compareStartDate.value, 
      this.formRange.controls.compareEndDate.value, 
      this.spendings
    );

    this.categoryStatisticForPieChart = this.categoryStatisticForPeriod.filter(categoryStat => !this.disabledCategories.has(categoryStat.category.id));
    this.spendingsForMultiLineChart = this.filteredSpendings.filter(spending => !this.disabledCategories.has(spending.category.id));

    this.compareCategoryStatisticForPieChart = await this.spendingsHelperService.calculateCategoryStatistic(compareSpendingsByRange);
    this.compareSpendingsForMultiLineChart = this.spendingsHelperService
      .getSpendingsByRange(
        this.formRange.controls.compareStartDate.value, 
        this.formRange.controls.compareEndDate.value, 
        compareSpendingsByRange
      ).filter(spending => !this.disabledCategories.has(spending.category.id));
      
    this.sortCategoryStatistic();
  }

  private updateFormGroup(range: { 
    startDate: moment.Moment; 
    endDate: moment.Moment; 
    compareStartDate?: moment.Moment; 
    compareEndDate?: moment.Moment; 
  }): void {
    this.formRange.patchValue({
      startDate: range.startDate.clone(),
      endDate: range.endDate.clone(),
      compareStartDate: range.compareStartDate.clone() || null,
      compareEndDate: range.compareEndDate.clone() || null,
    });
  }

  private updateFilteredSpendings(): void {
    const spendingsByRange: Spending[] = this.spendingsHelperService.getSpendingsByRange(
      this.formRange.controls.startDate.value, 
      this.formRange.controls.endDate.value, 
      this.spendings
    );
    this.filteredSpendings = spendingsByRange;
  }

  private sortCategoryStatistic(): void {
    this.categoryStatisticForPeriod.sort((a, b) => {
      let firstValue = a.value;
      let SecondValue = b.value;

      if(this.isCompareEnabled) {
        firstValue += this.getCompareDataForCard(a.category.id).value;
        SecondValue += this.getCompareDataForCard(b.category.id).value;
      }
      const isADisabled = this.disabledCategories.has(a.category.id);
      const isBDisabled = this.disabledCategories.has(b.category.id);

      if (isADisabled && !isBDisabled) {
        return 1;
      } else if (!isADisabled && isBDisabled) {
        return -1;
      }

      return this.isAscSort ? SecondValue - firstValue : firstValue - SecondValue;
    });
  }
}
