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
  imports: [...UI_COMPONENTS, ...MATTERIAL_COMPONENTS],
  templateUrl: './pie-chart-container.component.html',
  styleUrl: './pie-chart-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PieChartContainerComponent implements OnInit {
  @Input()
  public set spendings(value: Spending[]){
    this.setSpendings(this.startDateCtrl.value, this.endDateCtrl.value, value);
  }
  @Output()
  public categoryStatistic = new EventEmitter<ICategoryStatistic[]>();

  public pieChartData: IDonutData;
  
  public formRangeDate: FormGroup;
  public startDateCtrl: FormControl<moment.Moment> = new FormControl(moment(new Date()).startOf('month'));
  public endDateCtrl: FormControl<moment.Moment> = new FormControl(moment(new Date()));

  constructor(
    private readonly formBuilder: FormBuilder,
    private spendingsService: SpendingsService,
    private spendingsHelperService: SpendingCategoryHelperService,
    private cdr: ChangeDetectorRef
  ) { }

  public ngOnInit(): void {
    // this.spendingsService.init();
    this.formRangeDate = this.formBuilder.group({
      'startDate': this.startDateCtrl,
      'endDate': this.endDateCtrl,
    });
    this.formRangeDate.valueChanges
    // .pipe(
    //   switchMap(({startDate, endDate}) => 
    //     this.spendingsService.getSpendingsByRange(startDate, endDate)
    //   )
    // )
    .subscribe(({startDate, endDate}) => {
      this.setSpendings(startDate, endDate, this.spendings);
    });

    
    // this.startDateCtrl.setValue(moment(new Date()).startOf('month'));
    // this.endDateCtrl.setValue(moment(new Date()));
  }

  private async setSpendings(start: moment.Moment, end: moment.Moment, spendings: Spending[]): Promise<void> {
    const spendingsByRange = this.spendingsHelperService.getSpendingsByRange(start, end, spendings);
    const categoryStatisticForPeriod = await this.spendingsHelperService.calculateCategoryStatistic(spendingsByRange);
    this.pieChartData = this.spendingsHelperService.mapCategoryStatisticToChartData(categoryStatisticForPeriod);
    
    this.categoryStatistic.emit(categoryStatisticForPeriod);
    this.cdr.detectChanges();
  }
}
