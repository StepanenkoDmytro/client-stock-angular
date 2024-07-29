import { Component, ChangeDetectionStrategy, OnInit, Input, Output, EventEmitter, ChangeDetectorRef } from "@angular/core";
import { Router } from "@angular/router";
import { BehaviorSubject } from "rxjs";
import { MultiLineComponent, IMultiLineData } from "../../../../../core/UI/components/charts/multi-line/multi-line.component";
import { SpendingCategoryHelperService } from "../../../../../service/helpers/spending-category-helper.service";
import { SpendingsService } from "../../../../../service/spendings.service";
import { Spending } from "../../../../spending/model/Spending";
import { ICategoryStatistic } from "../../../model/SpendindStatistic";
import { StatisticStateService } from "../../../service/statistic-state.service";


const UI_COMPONENTS = [
  MultiLineComponent,
];

@Component({
  selector: 'pgz-multi-line-chart-container',
  standalone: true,
  imports: [...UI_COMPONENTS],
  templateUrl: './multi-line-chart-container.component.html',
  styleUrl: './multi-line-chart-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MultiLineChartContainerComponent implements OnInit {
  @Input()
  public set spendings(values: Spending[]){
    this.setSpendings(values);
  }
  @Output()
  public categoryStatistic: EventEmitter<ICategoryStatistic[]> = new EventEmitter();

  public _spendings: BehaviorSubject<Spending[]> = new BehaviorSubject([]);
  public categoryStatisticForPeriod: ICategoryStatistic[];

  public multiLineChartData: IMultiLineData;
  public multiLineChartDataByChildren: IMultiLineData[];

  constructor(
    private router: Router,
    private statisticStateHelper: StatisticStateService,
    private spendingsHelperService: SpendingCategoryHelperService,
    private spendingsService: SpendingsService,
    private cdr: ChangeDetectorRef
  ) { }

  public ngOnInit(): void {
    // this._spendings.subscribe(async (spendings) => {
    // // this.spendingsService.getAllSpendings().subscribe(async (spendings) => {
    //   console.log('gegs')
    //   const categoryStatisticForPeriod = await this.spendingsHelperService.calculateCategoryStatistic(spendings);
    //   this.multiLineChartDataByChildren = this.spendingsHelperService.mapCategoryStatisticToLineChartData(spendings, this.categoryStatisticForPeriod);
      
    //   const currentCategoryName = this.categoryStatisticForPeriod[0].category.title;
    //   this.multiLineChartData = this.spendingsHelperService.calculateLineChartByChildren(currentCategoryName, this.multiLineChartDataByChildren);
    //   // console.log('this.multiLineChartData', this.multiLineChartData)
    //   this.categoryStatistic.emit(categoryStatisticForPeriod);
    //   this.cdr.detectChanges();
    // })
    // });
  }

  private async setSpendings(spendings: Spending[]): Promise<void> {
    this.categoryStatisticForPeriod = await this.spendingsHelperService.calculateCategoryStatistic(spendings);
    console.log('categoryStatisticForPeriod', this.categoryStatisticForPeriod);
    this.multiLineChartDataByChildren = this.spendingsHelperService.mapCategoryStatisticToLineChartData(spendings, this.categoryStatisticForPeriod);
    
    const currentCategoryName = this.categoryStatisticForPeriod[0].category.title;
    this.multiLineChartData = this.spendingsHelperService.calculateLineChartByChildren(currentCategoryName, this.multiLineChartDataByChildren);
    // console.log('this.multiLineChartData', this.multiLineChartData)
    this.categoryStatistic.emit(this.categoryStatisticForPeriod);
    this.cdr.detectChanges();
  }
}
