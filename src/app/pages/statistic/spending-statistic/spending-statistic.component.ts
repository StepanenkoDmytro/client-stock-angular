import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { BarComponent } from '../../../core/UI/components/charts/bar/bar.component';
import { SpendingsService } from '../../../service/spendings.service';
import { HistorySpendingCardComponent } from '../../spending/components/history-spending/history-spending-card/history-spending-card.component';
import { ChartsHelperService } from '../../../core/UI/components/charts/bar/charts-helper.service';
import { Spending } from '../../spending/model/Spending';
import { MultiLineComponent } from '../../../core/UI/components/charts/multi-line/multi-line.component';
import { DonutComponent } from '../../../core/UI/components/charts/donut/donut.component';
import { SimpleDataModel } from '../../../domain/d3.domain';
import { FormControl, FormGroup, FormsModule, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import {provideMomentDateAdapter} from '@angular/material-moment-adapter';
import moment from 'moment';
import { DateFormatPipe } from '../../../core/UI/calendar/date-format.pipe';


const UI_COMPONENTS = [
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

  public spendings: Spending[];
  public donutData: SimpleDataModel[];

  public formRangeDate: FormGroup;
  public startDateCtrl: FormControl;
  public endDateCtrl: FormControl;

  constructor(
    private readonly formBuilder: FormBuilder,
    private chartsHelperService: ChartsHelperService,
    private spendingsService: SpendingsService,
  ) { }

  public ngOnInit(): void {
    this.spendingsService.init();

    this.startDateCtrl = new FormControl(moment(new Date()).startOf('month'));
    this.endDateCtrl = new FormControl(moment(new Date()));

    this.formRangeDate = this.formBuilder.group({
      'startDate': this.startDateCtrl,
      'endDate': this.endDateCtrl,
    });

    this.spendingsService.getAll().subscribe(allSpendings => {
      this.spendings = allSpendings;
      this.donutData = this.chartsHelperService.spendingsMapToSimpleData(allSpendings);
    });
  }
}
