import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import moment from 'moment';
import { DateFormatPipe } from '../../../../../pipe/date-format.pipe';
import { IconComponent } from '../../../../../core/UI/components/icon/icon.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import {MatRadioModule} from '@angular/material/radio';

const UI_COMPONENTS = [
  IconComponent
];

const MATTERIAL_COMPONENTS = [
  MatExpansionModule,
  MatFormFieldModule,
  MatDatepickerModule,
  MatSlideToggleModule,
  ReactiveFormsModule,
  MatCheckboxModule,
  MatRadioModule,
  CommonModule
];

@Component({
  selector: 'pgz-range-controller',
  standalone: true,
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'uk-UA' },
    provideMomentDateAdapter(),
  ],
  imports: [...UI_COMPONENTS, ...MATTERIAL_COMPONENTS, CommonModule, DateFormatPipe],
  templateUrl: './range-controller.component.html',
  styleUrl: './range-controller.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RangeControllerComponent implements OnInit {
  @Input()
  public isPosibleCompare: boolean = true;
  @Output()
  public rangeChange = new EventEmitter<{
    startDate: moment.Moment,
    endDate: moment.Moment,
    compareStartDate?: moment.Moment,
    compareEndDate?: moment.Moment
  }>();
  @Output()
  public isCompareEnabled = new EventEmitter<boolean>(false);
  
  public formRange: FormGroup;
  public startDateCtrl: FormControl<moment.Moment> = new FormControl(moment(new Date()).startOf('month'));
  public endDateCtrl: FormControl<moment.Moment> = new FormControl(moment(new Date()));

  public compareStartDateCtrl: FormControl<moment.Moment> = new FormControl(moment());
  public compareEndDateCtrl: FormControl<moment.Moment> = new FormControl(moment());

  public selectedRange: FormControl<'month' | '90' | '120' | '365'> = new FormControl('month');
  public isCompareEnabledCtrl: FormControl<boolean> = new FormControl(false);

  constructor(
    private readonly formBuilder: FormBuilder,
  ) { }

  public ngOnInit(): void {
    this.formRange = this.formBuilder.group({
      startDate: this.startDateCtrl,
      endDate: this.endDateCtrl,
      compareStartDate: this.compareStartDateCtrl,
      compareEndDate: this.compareEndDateCtrl,
      isCompareEnabled: this.isCompareEnabledCtrl,
      selectedRange: this.selectedRange
    });

    this.formRange.valueChanges.subscribe((range) => {
      this.emitRangeChange();
    });

    this.isCompareEnabledCtrl.valueChanges.subscribe((value) => {
      this.isCompareEnabled.emit(value);
      if (value) {
        this.setCompareRange();
      }
    });

    this.emitRangeChange();
  }

  private setCompareRange(): void {
    const currStartDate: moment.Moment = this.startDateCtrl.value.clone();
    const compareEndDate: moment.Moment = currStartDate.clone().subtract(1, 'days');

    let compareStartDate: moment.Moment = moment();

    if(this.selectedRange.value === 'month') {
      compareStartDate = compareEndDate.clone().startOf('month')
    } else {
      const countDays = parseInt(this.selectedRange.value);
      compareStartDate = compareEndDate.clone().subtract(countDays, 'days');
    }

    this.compareStartDateCtrl.setValue(compareStartDate);
    this.compareEndDateCtrl.setValue(compareEndDate);


  }

  public changeToCurrentMonthRange(): void {
    this.selectedRange.setValue('month');
    this.startDateCtrl.setValue(moment(new Date()).startOf('month'));
    this.endDateCtrl.setValue(moment(new Date()));
    this.setCompareRange();
  }
  
  public changeTo90DayRange(): void {
    this.selectedRange.setValue('90');
    const currDate = moment(new Date());
    const countDays = parseInt(this.selectedRange.value);

    this.endDateCtrl.setValue(moment(new Date()));
    this.startDateCtrl.setValue(currDate.subtract(countDays, 'days'));
    this.setCompareRange();
  }
  
  public changeTo120DayRange(): void {
    this.selectedRange.setValue('120');
    const currDate = moment(new Date());
    const countDays = parseInt(this.selectedRange.value);

    this.startDateCtrl.setValue(moment().subtract(120, 'days').startOf('day'));
    this.endDateCtrl.setValue(moment().endOf('day'));
    this.setCompareRange();
  }
  
  public changeTo360DayRange(): void {
    this.selectedRange.setValue('365');
    const currDate = moment(new Date());
    const countDays = parseInt(this.selectedRange.value);

    this.startDateCtrl.setValue(moment().subtract(countDays, 'days').startOf('day'));
    this.endDateCtrl.setValue(moment().endOf('day'));
    this.setCompareRange();
  }

  private emitRangeChange(): void {
    const { startDate, endDate, compareStartDate, compareEndDate } = this.formRange.value;
    
    this.rangeChange.emit({
      startDate,
      endDate,
      compareStartDate,
      compareEndDate
    });
  }

  // public toogleCompare(): void {
    
  // }
  
}
