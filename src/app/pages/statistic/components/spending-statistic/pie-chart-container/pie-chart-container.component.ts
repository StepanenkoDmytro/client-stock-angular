import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SpendingsService } from '../../../../../service/spendings.service';
import { SpendingCategoryHelperService } from '../../../../../service/helpers/spending-category-helper.service';
import moment from 'moment';
import { IDonutData } from '../../../../../core/UI/components/charts/donut/donut.component';
import { PieChartComponent } from '../../../../../core/UI/components/charts/pie-chart/pie-chart.component';
import { IconComponent } from '../../../../../core/UI/components/icon/icon.component';
import { DateFormatPipe } from '../../../../../core/UI/calendar/date-format.pipe';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { Spending } from '../../../../spending/model/Spending';
import { ICategoryStatistic } from '../../../model/SpendindStatistic';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';

const UI_COMPONENTS = [
  PieChartComponent,
  IconComponent,
  DateFormatPipe,
];

const MATTERIAL_COMPONENTS = [
  MatFormFieldModule,
  MatDatepickerModule,
  ReactiveFormsModule,
  MatCheckboxModule
];

@Component({
  selector: 'pgz-pie-chart-container',
  standalone: true,
   providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'uk-UA' },
    provideMomentDateAdapter(),
  ],
  imports: [...UI_COMPONENTS, ...MATTERIAL_COMPONENTS, CommonModule],
  templateUrl: './pie-chart-container.component.html',
  styleUrl: '../spending-statistic.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PieChartContainerComponent implements OnInit {
  @Input()
  public set spendings(value: Spending[]) {
    this._spendings = value;
    this.setSpendings(this.startDateCtrl.value, this.endDateCtrl.value, value);
  }
  @Output()
  public categoryStatistic = new EventEmitter<ICategoryStatistic[]>();

  public _spendings: Spending[] = [];

  public pieChartData: IDonutData;
  public comparePieChartData: IDonutData;
  
  public formRangeDate: FormGroup;
  public startDateCtrl: FormControl<moment.Moment> = new FormControl(moment(new Date()).startOf('month'));
  public endDateCtrl: FormControl<moment.Moment> = new FormControl(moment(new Date()));

  public formRangeCompareDate: FormGroup;
  public compareStartDateCtrl: FormControl<moment.Moment> = new FormControl();
  public compareEndDateCtrl: FormControl<moment.Moment> = new FormControl();

  public selectedRange: 'month' | '90' | '120' | '360' = 'month';
  public isCompareEnabled: boolean = false;

  constructor(
    private readonly formBuilder: FormBuilder,
    private spendingsService: SpendingsService,
    private spendingsHelperService: SpendingCategoryHelperService,
    private cdr: ChangeDetectorRef
  ) { }

  public ngOnInit(): void {
    this.formRangeDate = this.formBuilder.group({
      'startDate': this.startDateCtrl,
      'endDate': this.endDateCtrl,
    });

    this.formRangeCompareDate = this.formBuilder.group({
      'startCompareDate': this.compareStartDateCtrl,
      'endCompareDate': this.compareEndDateCtrl,
    });

    this.formRangeDate.valueChanges.subscribe(({startDate, endDate}) => {
      this.setSpendings(startDate, endDate, this._spendings);

      if(this.isCompareEnabled) {
        this.calculateCompareRange();
      }
    });

    this.formRangeCompareDate.valueChanges.subscribe(({startCompareDate, endCompareDate}) => {
      this.compareSpendings(startCompareDate, endCompareDate, this._spendings);
    });
  }

  public changeToCurrentMonthRange(): void {
    this.selectedRange = 'month';
    this.startDateCtrl.setValue(moment().startOf('month'));
    this.endDateCtrl.setValue(moment().endOf('month'));
  }
  
  public changeTo90DayRange(): void {
    this.selectedRange = '90';
    this.startDateCtrl.setValue(moment().subtract(90, 'days').startOf('day'));
    this.endDateCtrl.setValue(moment().endOf('day'));
  }
  
  public changeTo120DayRange(): void {
    this.selectedRange = '120';
    this.startDateCtrl.setValue(moment().subtract(120, 'days').startOf('day'));
    this.endDateCtrl.setValue(moment().endOf('day'));
  }
  
  public changeTo360DayRange(): void {
    this.selectedRange = '360';
    this.startDateCtrl.setValue(moment().subtract(360, 'days').startOf('day'));
    this.endDateCtrl.setValue(moment().endOf('day'));
  }

  public toogleCompare(): void {
    this.isCompareEnabled = !this.isCompareEnabled;
  
    this.calculateCompareRange();
  }
  
  private calculateCompareRange(): void {
    const daysDifference = this.endDateCtrl.value.diff(this.startDateCtrl.value, 'days');
  
    const monthAgoStart = this.startDateCtrl.value.clone().subtract(daysDifference, 'days').startOf('month');
    const monthAgoEnd = monthAgoStart.clone().add(daysDifference, 'days').endOf('month');
  
    this.formRangeCompareDate.setValue({
      startCompareDate: monthAgoStart,
      endCompareDate: monthAgoEnd,
    });
  }
  
  private async setSpendings(start: moment.Moment, end: moment.Moment, spendings: Spending[]): Promise<void> {
    const spendingsByRange: Spending[] = this.spendingsHelperService.getSpendingsByRange(start, end, spendings);
    const categoryStatisticForPeriod: ICategoryStatistic[] = await this.spendingsHelperService.calculateCategoryStatistic(spendingsByRange);
    
    this.pieChartData = this.spendingsHelperService.mapCategoryStatisticToChartData(categoryStatisticForPeriod);
    this.categoryStatistic.emit(categoryStatisticForPeriod);
    this.cdr.detectChanges();
  }

  private async compareSpendings(start: moment.Moment, end: moment.Moment, spendings: Spending[]): Promise<void> {
    const spendingsByRange: Spending[] = this.spendingsHelperService.getSpendingsByRange(start, end, spendings);
    const categoryStatisticForPeriod: ICategoryStatistic[] = await this.spendingsHelperService.calculateCategoryStatistic(spendingsByRange);

    this.comparePieChartData = this.spendingsHelperService.mapCategoryStatisticToChartData(categoryStatisticForPeriod);
    this.cdr.detectChanges();
  }
}
