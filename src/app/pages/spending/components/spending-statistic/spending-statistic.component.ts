import { CommonModule, AsyncPipe } from "@angular/common";
import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { FormsModule, ReactiveFormsModule, FormGroup } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatSelectModule } from "@angular/material/select";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatTabsModule } from "@angular/material/tabs";
import { RouterModule, ActivatedRoute, Router } from "@angular/router";
import { Subscription, combineLatest, switchMap } from "rxjs";
import { ArrowBackComponent } from "../../../../core/UI/components/arrow-back/arrow-back.component";
import { BarComponent } from "../../../../core/UI/components/charts/bar/bar.component";
import { DonutComponent } from "../../../../core/UI/components/charts/donut/donut.component";
import { MultiLineComponent } from "../../../../core/UI/components/charts/multi-line/multi-line.component";
import { FilterWrapperComponent } from "../../../../core/UI/components/filter-wrapper/filter-wrapper.component";
import { IconComponent } from "../../../../core/UI/components/icon/icon.component";
import { ToggleSwitchComponent } from "../../../../core/UI/components/toggle-switch/toggle-switch.component";
import { Category } from "../../../../domain/category.domain";
import { DateFormatPipe } from "../../../../pipe/date-format.pipe";
import { SpendingCategoryHelperService } from "../../../../service/helpers/spending-category-helper.service";
import { SpendingsService } from "../../../../service/spendings.service";
import { PrevRouteComponent } from "../../../../core/UI/components/prev-route/prev-route.component";
import { RangeForm, ICategoryStatistic, initializeFormGroup } from "../../../statistic/model/SpendindStatistic";
import { StatisticStateService } from "../../../statistic/service/statistic-state.service";
import { Spending } from "../../model/Spending";
import { HistorySpendingCardComponent } from "../history-spending/history-spending-card/history-spending-card.component";
import { MultiLineChartContainerComponent } from "./multi-line-chart-container/multi-line-chart-container.component";
import { PieChartContainerComponent } from "./pie-chart-container/pie-chart-container.component";
import { RangeControllerComponent } from "./range-controller/range-controller.component";
import { SpendingStatisticCardComponent } from "./spending-statistic-card/spending-statistic-card.component";


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
  PrevRouteComponent,
  ToggleSwitchComponent,
  FilterWrapperComponent,
  ArrowBackComponent
];

const MATERIAL_MODULES = [
  MatFormFieldModule,
  MatSelectModule,
  MatTabsModule,
  MatSidenavModule,
  MatIconModule,
  MatButtonModule,
  MatDatepickerModule, 
  FormsModule, 
  ReactiveFormsModule,
  MatCheckboxModule,
  CommonModule
];
@Component({
  selector: 'pgz-spending-statistic',
  standalone: true,
  imports: [...UI_COMPONENTS, ...MATERIAL_MODULES, DateFormatPipe, AsyncPipe, RouterModule],
  templateUrl: './spending-statistic.component.html',
  styleUrl: './spending-statistic.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpendingStatisticComponent implements OnInit, OnDestroy {

  public currCategory: Category | null;

  public chartTypeCtrl: 'pie' | 'multiline' = 'multiline';
  public isCompareEnabled: boolean = false;

  public isAscSort : boolean = true;
  get categoriesForFilter(): { id: string; title: string }[] {
    return this.categoryStatisticForPeriod.map(category => ({
      id: category.category.id,
      title: category.category.title,
    }));
  }

  get selectedCategoriesSet(): Set<string> {
    return new Set(this.categoryStatisticForPeriod.map(category => category.category.id).filter(category => !this.disabledCategories.has(category)));
  }
  public isAllCategoriesChecked: boolean = true;
  public disabledCategories: Set<string> = new Set<string>();
  // public disabledCategories$: BehaviorSubject<Set<string>> = new BehaviorSubject<Set<string>>(new Set<string>());
  public filteredSpendings: Spending[] = [];

  public spendings: Spending[] = [];
  public formRange: FormGroup<RangeForm>;
  public categoryStatisticForPeriod: ICategoryStatistic[] = [];
  public categoryStatisticForPieChart: ICategoryStatistic[] = [];
  public compareCategoryStatisticForPieChart: ICategoryStatistic[] = [];
  public spendingsForMultiLineChart: Spending[] = [];
  public compareSpendingsForMultiLineChart: Spending[] = [];

  public rootPage: string = '/spending/statistic';

  public chartsColorsForCompare: { [key: string]: string; } = {};
  public subscription: Subscription;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private spendingsService: SpendingsService,
    private statisticStateHelper: StatisticStateService,
    private spendingsHelperService: SpendingCategoryHelperService,
    private cdr: ChangeDetectorRef
  ) { }

  public updateDisabledCategories(selectedIds: Set<string>): void {
    const disabled = this.categoriesForFilter
        .filter(category => !selectedIds.has(category.id))
        .map(category => category.id);
    this.disabledCategories = new Set(disabled);

    this.setChartsData();
    this.cdr.detectChanges();
  } 

  public ngOnInit(): void {
    
    this.spendingsService.init();
    this.formRange = initializeFormGroup();

    this.subscription = combineLatest([
      this.route.paramMap,
      this.spendingsService.getAllSpendings(),
      this.formRange.valueChanges
    ]).pipe(
      switchMap(async ([paramMap, spendings]) => {
        // debugger
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

  public isVisibleCategory(categoryId: string): boolean {
    return !this.disabledCategories.has(categoryId);
  }

  public toggleCategory(category: ICategoryStatistic, checked: boolean): void {
    if(checked) {
      this.disabledCategories.delete(category.category.id);
    } else {
      this.disabledCategories.add(category.category.id);
    }

    this.setChartsData();
    this.cdr.detectChanges();
  }

  public prevRoute(): void {
    if(this.currCategory && this.currCategory.parent) {
      this.router.navigate([this.rootPage, this.currCategory.parent]);
    } else {
      this.router.navigate(['/spending']);
    }
    
  }

  public onCardClick(category: Category): void {
    if(category.title === 'Other') {
      return;
    }

    this.statisticStateHelper.addBreadCrumb(category);
    this.router.navigate([this.rootPage, category.id]);
  }

  public toogleCompare(): void {
    this.isCompareEnabled = !this.isCompareEnabled;
    this.cdr.markForCheck();
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

  public chartTypeChange(chartType: string): void {
    if(chartType === 'pie' || chartType === 'multiline') {
      this.chartTypeCtrl = chartType;
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

  public chartsColors(colors: { [key: string]: string; }) {
    this.chartsColorsForCompare = colors;
  }

  public toggleAllCategories(): boolean {
    return this.disabledCategories.size === this.categoryStatisticForPeriod.length;
  }
}
