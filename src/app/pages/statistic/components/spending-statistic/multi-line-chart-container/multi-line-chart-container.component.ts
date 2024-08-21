import { Component, ChangeDetectionStrategy, OnInit, Input, Output, EventEmitter, ChangeDetectorRef } from "@angular/core";
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
  styleUrl: './multi-line-chart-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MultiLineChartContainerComponent implements OnInit {

  @Input()
  public set spendings(values: Spending[]) {
    this._spendings = values;
    this.setSpendings(this.startDateCtrl.value, this.endDateCtrl.value, values);
  }
  @Output()
  public categoryStatistic: EventEmitter<ICategoryStatistic[]> = new EventEmitter();

  public formRangeDate: FormGroup;
  public startDateCtrl: FormControl<moment.Moment> = new FormControl(moment().startOf('year'));
  public endDateCtrl: FormControl<moment.Moment> = new FormControl(moment().endOf('year'));
  
  public selectedRange: 'year' | 'all' = 'year';

  public _spendings: Spending[] = [];
  public categoryStatisticForPeriod: ICategoryStatistic[];

  public multiLineChartData: IMultiLineData;
  public multiLineChartDataByChildren: IMultiLineData[];

  constructor(
    private readonly formBuilder: FormBuilder,
    private spendingsHelperService: SpendingCategoryHelperService,
    private cdr: ChangeDetectorRef
  ) { }

  public ngOnInit(): void {
    this.formRangeDate = this.formBuilder.group({
      'startDate': this.startDateCtrl,
      'endDate': this.endDateCtrl,
    });

    this.formRangeDate.valueChanges.subscribe(({startDate, endDate}) => {
      this.setSpendings(startDate, endDate, this._spendings);
    });
  }

  public changeToYearRange(): void {
    this.selectedRange = 'year';
    this.startDateCtrl.setValue(moment().startOf('year'));
    this.endDateCtrl.setValue(moment().endOf('year'));
  }
  
  public changeToAllTimeRange(): void {
    this.selectedRange = 'all';
    this.startDateCtrl.setValue(moment('2000-01-01'));
    this.endDateCtrl.setValue(moment());
  
  }

  private async setSpendings(start: moment.Moment, end: moment.Moment, spendings: Spending[]): Promise<void> {
    const spendingsByRange: Spending[] = this.spendingsHelperService.getSpendingsByRange(start, end, spendings);
    this.categoryStatisticForPeriod = await this.spendingsHelperService.calculateCategoryStatistic(spendingsByRange);
    
    this.multiLineChartDataByChildren = this.spendingsHelperService.mapCategoryStatisticToLineChartData(spendings, this.categoryStatisticForPeriod);
    const currentCategoryName = this.categoryStatisticForPeriod[0].category.title;

    this.multiLineChartData = this.spendingsHelperService.calculateLineChartByChildren(currentCategoryName, this.multiLineChartDataByChildren);
    this.categoryStatistic.emit(this.categoryStatisticForPeriod);
    this.cdr.detectChanges();
  }
}
