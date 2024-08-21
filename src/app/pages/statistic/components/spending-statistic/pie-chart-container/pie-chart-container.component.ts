import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { switchMap } from 'rxjs';
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

const UI_COMPONENTS = [
  PieChartComponent,
  IconComponent,
  DateFormatPipe,
];

const MATTERIAL_COMPONENTS = [
  MatDatepickerModule,
  ReactiveFormsModule,
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
  styleUrl: './pie-chart-container.component.scss',
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
  
  public formRangeDate: FormGroup;
  public startDateCtrl: FormControl<moment.Moment> = new FormControl(moment(new Date()).startOf('month'));
  public endDateCtrl: FormControl<moment.Moment> = new FormControl(moment(new Date()));
  public selectedRange: 'month' | 'half-year' | 'year' | 'all' = 'month';


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

    this.formRangeDate.valueChanges.subscribe(({startDate, endDate}) => {
      this.setSpendings(startDate, endDate, this._spendings);
    });
  }

  public changeToCurrentMonthRange(): void {
    this.selectedRange = 'month';
    this.startDateCtrl.setValue(moment().startOf('month'));
    this.endDateCtrl.setValue(moment().endOf('month'));
  }
  
  public changeToHalfYearRange(): void {
    this.selectedRange = 'half-year';
    this.startDateCtrl.setValue(moment().subtract(6, 'months').startOf('month'));
    this.endDateCtrl.setValue(moment().endOf('month'));
  }
  
  public changeToYearRange(): void {
    this.selectedRange = 'year';
    this.startDateCtrl.setValue(moment().startOf('year'));
    this.endDateCtrl.setValue(moment().endOf('year'));
  }
  
  public changeToAllTimeRange(): void {
    // debugger;
    this.selectedRange = 'all';
    this.startDateCtrl.setValue(moment('2000-01-01'));
    this.endDateCtrl.setValue(moment());
  
  }
  

  private async setSpendings(start: moment.Moment, end: moment.Moment, spendings: Spending[]): Promise<void> {
    const spendingsByRange: Spending[] = this.spendingsHelperService.getSpendingsByRange(start, end, spendings);
    const categoryStatisticForPeriod: ICategoryStatistic[] = await this.spendingsHelperService.calculateCategoryStatistic(spendingsByRange);
    
    this.pieChartData = this.spendingsHelperService.mapCategoryStatisticToChartData(categoryStatisticForPeriod);
    this.categoryStatistic.emit(categoryStatisticForPeriod);
    this.cdr.detectChanges();
  }
}
