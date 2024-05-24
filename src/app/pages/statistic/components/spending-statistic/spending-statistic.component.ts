import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { BarComponent } from '../../../../core/UI/components/charts/bar/bar.component';
import { SpendingsService } from '../../../../service/spendings.service';
import { HistorySpendingCardComponent } from '../../../spending/components/history-spending/history-spending-card/history-spending-card.component';
import { MultiLineComponent } from '../../../../core/UI/components/charts/multi-line/multi-line.component';
import { DonutComponent } from '../../../../core/UI/components/charts/donut/donut.component';
import { SimpleDataModel } from '../../../../domain/d3.domain';
import { FormControl, FormGroup, FormsModule, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import {provideMomentDateAdapter} from '@angular/material-moment-adapter';
import moment from 'moment';
import { DateFormatPipe } from '../../../../core/UI/calendar/date-format.pipe';
import { SpendingStatisticCardComponent } from './spending-statistic-card/spending-statistic-card.component';
import { ICategoryStatistic } from '../../model/SpendindStatistic';
import { switchMap } from 'rxjs';
import { SpendingStatisticHelperService } from '../../service/spending-statistic-helper.service';


const UI_COMPONENTS = [
  SpendingStatisticCardComponent,
  DonutComponent,
  BarComponent,
  HistorySpendingCardComponent,
  MultiLineComponent,
  DateFormatPipe
];

const MATERIAL_MODULES = [
  MatTabsModule,
  MatExpansionModule,
  MatIconModule,
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
  public categoryData: ICategoryStatistic[];
  public donutData: SimpleDataModel[];

  public formRangeDate: FormGroup;
  public startDateCtrl: FormControl = new FormControl();
  public endDateCtrl: FormControl = new FormControl();

  constructor(
    private readonly formBuilder: FormBuilder,
    private spendingsHelperService: SpendingStatisticHelperService,
    private spendingsService: SpendingsService,
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
    ).subscribe(spendings => {
      this.categoryData = this.spendingsHelperService.spendingsMapToCategoryData(spendings);
      this.donutData = this.spendingsHelperService.mapCategoryDataToChartData(this.categoryData);
    });
    
    this.startDateCtrl.setValue(moment(new Date()).startOf('month'));
    this.endDateCtrl.setValue(moment(new Date()));
  }
}
