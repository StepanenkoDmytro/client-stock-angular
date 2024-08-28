import { Component, ChangeDetectionStrategy, OnInit, Input, Output, EventEmitter, ChangeDetectorRef, OnChanges, SimpleChanges, ViewChild, AfterViewInit } from "@angular/core";
import { MultiLineComponent, IMultiLineData } from "../../../../../core/UI/components/charts/multi-line/multi-line.component";
import { SpendingCategoryHelperService } from "../../../../../service/helpers/spending-category-helper.service";
import { Spending } from "../../../../spending/model/Spending";
import { ICategoryStatistic } from "../../../model/SpendindStatistic";
import { FormBuilder, FormControl, FormGroup } from "@angular/forms";
import { CommonModule } from "@angular/common";
import moment from "moment";
import { DateFormatPipe } from "../../../../../core/UI/calendar/date-format.pipe";


const UI_COMPONENTS = [
  MultiLineComponent,
  DateFormatPipe
];

const MATERIAL_COMPONENTS = [
  CommonModule
];

@Component({
  selector: 'pgz-multi-line-chart-container',
  standalone: true,
  imports: [...UI_COMPONENTS, ...MATERIAL_COMPONENTS],
  templateUrl: './multi-line-chart-container.component.html',
  styleUrl: '../spending-statistic.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MultiLineChartContainerComponent {

  @Input()
  public spendings: Spending[] = [];
  @Input()
  public activeCategories: ICategoryStatistic[] = [];
  @Input()
  public isCompareEnabled: boolean = false;
  @Input()
  public compareSpendings: Spending[] = [];

  public multiLineChartData: IMultiLineData[];
  public multiLineChartDataByChildren: IMultiLineData[];

  constructor(
    private spendingsHelperService: SpendingCategoryHelperService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['spendings'] || changes['activeCategories'] || changes['isCompareEnabled'] || changes['compareSpendings']) {
      this.updateChartData();
    }
  }

  private updateChartData(): void {
    
    // Формування даних для основного графіка
    const currentData = this.spendingsHelperService.mapCategoryStatisticToLineChartData(this.spendings, this.activeCategories);
    this.multiLineChartData = [this.spendingsHelperService.calculateLineChartByChildren('currentData', currentData)];

    // Якщо порівняння увімкнене, додаємо порівняльні дані
    if (this.isCompareEnabled && this.compareSpendings.length) {
      
      const compareData = this.spendingsHelperService.mapCategoryStatisticToLineChartData(this.compareSpendings, this.activeCategories);
      const compareLineData = this.spendingsHelperService.calculateLineChartByChildren('compareData', compareData);
      this.multiLineChartData.push(compareLineData);
    }
    console.log(this.multiLineChartData);
    // Оновлення детектора змін
    this.cdr.detectChanges();
  }


  // private setData(): void {
  //   this.multiLineChartDataByChildren = this.spendingsHelperService.mapCategoryStatisticToLineChartData(this.spendings, this.activeCategories);
  //   this.multiLineChartData = [this.spendingsHelperService.calculateLineChartByChildren('currentData', this.multiLineChartDataByChildren)];
  // }

  // private setCompareData(): void {
  //   this.multiLineChartDataByChildren = this.spendingsHelperService.mapCategoryStatisticToLineChartData(this.compareSpendings, this.activeCategories);
  //   const compareData = this.spendingsHelperService.calculateLineChartByChildren('compareData', this.multiLineChartDataByChildren);
  //   this.multiLineChartData.push(compareData);
  // }
  
}
