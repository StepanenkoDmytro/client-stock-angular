import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import moment from 'moment';

const MATTERIAL_COMPONENTS = [
  MatFormFieldModule,
  MatDatepickerModule,
  ReactiveFormsModule,
  MatCheckboxModule
];

@Component({
  selector: 'pgz-range-controller',
  standalone: true,
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'uk-UA' },
    provideMomentDateAdapter(),
  ],
  imports: [...MATTERIAL_COMPONENTS, CommonModule],
  templateUrl: './range-controller.component.html',
  styleUrl: './range-controller.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RangeControllerComponent implements OnInit {
  @Input()
  public set isCompareEnabled(value: boolean) {
    this.isCompareEnabledCtrl.setValue(value);
  }
  @Output()
  public rangeChange = new EventEmitter<{
    startDate: moment.Moment,
    endDate: moment.Moment,
    compareStartDate?: moment.Moment,
    compareEndDate?: moment.Moment
  }>();
  
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

    this.emitRangeChange();
  }

  private setCompareRange(): void {
    const currStartDate: moment.Moment = this.startDateCtrl.value.clone();
    const compareStartDate: moment.Moment = currStartDate.clone().subtract(1, 'days');

    let compareEndDate: moment.Moment = moment();

    if(this.selectedRange.value === 'month') {
      compareEndDate = compareStartDate.clone().startOf('month')
    } else {
      const countDays = parseInt(this.selectedRange.value);
      compareEndDate = compareStartDate.clone().subtract(countDays, 'days');
    }

    this.compareStartDateCtrl.setValue(compareEndDate);
    this.compareEndDateCtrl.setValue(compareStartDate);
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
    
    if (this.isCompareEnabledCtrl) {
      this.rangeChange.emit({
        startDate,
        endDate,
        compareStartDate: compareStartDate,
        compareEndDate: compareEndDate
      });
    } else {
      this.rangeChange.emit({
        startDate,
        endDate
      });
    }
  }
  
}
