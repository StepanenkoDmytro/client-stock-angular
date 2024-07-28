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
import { StatisticChartsWrapperComponent } from '../statistic-charts-wrapper/statistic-charts-wrapper.component';


const UI_COMPONENTS = [
  DonutComponent,
  BarComponent,
  HistorySpendingCardComponent,
  IconComponent,
  MultiLineComponent,
  DateFormatPipe,
  StatisticChartsWrapperComponent
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
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'uk-UA' },
    provideMomentDateAdapter(),
  ],
  imports: [...UI_COMPONENTS, ...MATERIAL_MODULES],
  templateUrl: './spending-statistic.component.html',
  styleUrl: './spending-statistic.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpendingStatisticComponent implements OnInit {
  public categoryStatisticForPeriod: ICategoryStatistic[];
  public donutData: IDonutData;

  public formRangeDate: FormGroup;
  public startDateCtrl: FormControl = new FormControl();
  public endDateCtrl: FormControl = new FormControl();



  constructor(
    private readonly formBuilder: FormBuilder,
    private router: Router,
    private statisticStateHelper: StatisticStateService,
    private spendingsHelperService: SpendingCategoryHelperService,
    private spendingsService: SpendingsService,
    private cdr: ChangeDetectorRef
  ) { }

  public ngOnInit(): void {
    this.spendingsService.init();

    this.formRangeDate = this.formBuilder.group({
      'startDate': this.startDateCtrl,
      'endDate': this.endDateCtrl,
    });

    this.formRangeDate.valueChanges.pipe(
      switchMap(({startDate, endDate}) => 
        this.spendingsService.getSpendingsByRange(startDate, endDate)
      )
    ).subscribe(async (spendings) => {
      this.categoryStatisticForPeriod = await this.spendingsHelperService.calculateCategoryStatistic(spendings);
      this.donutData = this.spendingsHelperService.mapCategoryStatisticToChartData(this.categoryStatisticForPeriod);
      this.cdr.detectChanges();
    });

    
    this.startDateCtrl.setValue(moment(new Date()).startOf('month'));
    this.endDateCtrl.setValue(moment(new Date()));
  }
}
