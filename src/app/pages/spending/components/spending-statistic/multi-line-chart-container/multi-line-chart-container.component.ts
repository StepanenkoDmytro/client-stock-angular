import { Component, ChangeDetectionStrategy, OnInit, Input, Output, EventEmitter, ChangeDetectorRef, OnChanges, SimpleChanges, ViewChild, AfterViewInit } from "@angular/core";

import { SpendingCategoryHelperService } from "../../../../../service/helpers/spending-category-helper.service";
import { Spending } from "../../../model/Spending";
import { ICategoryStatistic } from "../../../../statistic/model/SpendindStatistic";
import { FormBuilder, FormControl, FormGroup } from "@angular/forms";
import { CommonModule } from "@angular/common";
import moment from "moment";
import { DateFormatPipe } from "../../../../../pipe/date-format.pipe";
import { IMultiLineData, MultiLineComponent } from "../../../../../core/UI/components/charts/multi-line/multi-line.component";


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
  @Input()
  public startRange:moment.Moment;
  @Input()
  public startCompareRange:moment.Moment;

  @Output()
  public chartColors: EventEmitter<{ [key: string]: string }> = new EventEmitter();

  public multiLineChartData: IMultiLineData[] = [];
  public multiLineChartDataByChildren: IMultiLineData[] = [];

  constructor(
    private spendingsHelperService: SpendingCategoryHelperService,
    private cdr: ChangeDetectorRef
  ) { }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['spendings'] || changes['activeCategories'] || changes['isCompareEnabled'] || changes['compareSpendings']) {
      this.updateChartData();
    }
  }
  
  private updateChartData(): void {
    const currentData = this.spendingsHelperService.mapCategoryStatisticToLineChartData(this.spendings, this.activeCategories);
    this.multiLineChartData = [this.spendingsHelperService.calculateLineChartByChildren("Primary", currentData)];

    if (this.isCompareEnabled && this.compareSpendings.length) {
      const compareData = this.spendingsHelperService.mapCategoryStatisticToLineChartData(this.compareSpendings, this.activeCategories);
      const compareLineData = this.spendingsHelperService.calculateLineChartByChildren("Comparative", compareData);
      this.multiLineChartData.push(compareLineData);
    }
  }

  public getChartColors(colors: { [key: string]: string; }): void {
    this.chartColors.emit(colors);
  }
}
