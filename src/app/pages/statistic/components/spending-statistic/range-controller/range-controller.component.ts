import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output } from '@angular/core';
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
  @Output()
  public rangeChange = new EventEmitter<{
    startDate: moment.Moment,
    endDate: moment.Moment,
    isCompareEnabled: boolean,
    compareStartDate?: moment.Moment,
    compareEndDate?: moment.Moment
  }>();
  
  public formRange: FormGroup;
  public startDateCtrl: FormControl<moment.Moment> = new FormControl(moment(new Date()).startOf('month'));
  public endDateCtrl: FormControl<moment.Moment> = new FormControl(moment(new Date()));

  public compareStartDateCtrl: FormControl<moment.Moment> = new FormControl();
  public compareEndDateCtrl: FormControl<moment.Moment> = new FormControl();

  public selectedRange: FormControl<'month' | '90' | '120' | '360'> = new FormControl('month');
  public isCompareEnabled: FormControl<boolean> = new FormControl(false);

  constructor(
    private readonly formBuilder: FormBuilder,
  ) { }

  public ngOnInit(): void {
    this.formRange = this.formBuilder.group({
      startDate: this.startDateCtrl,
      endDate: this.endDateCtrl,
      compareStartDate: this.compareStartDateCtrl,
      compareEndDate: this.compareEndDateCtrl,
      isCompareEnabled: this.isCompareEnabled,
      selectedRange: this.selectedRange
    });
    

    this.formRange.valueChanges.subscribe(() => {
      this.emitRangeChange();
    });

    this.emitRangeChange();
  }

  public toogleCompare(): void {
    this.isCompareEnabled.setValue(!this.isCompareEnabled.value);
  }

  public changeToCurrentMonthRange(): void {
    this.selectedRange.setValue('month');
    this.startDateCtrl.setValue(moment().startOf('month'));
    this.endDateCtrl.setValue(moment().endOf('month'));
  }
  
  public changeTo90DayRange(): void {
    this.selectedRange.setValue('90');
    this.startDateCtrl.setValue(moment().subtract(90, 'days').startOf('day'));
    this.endDateCtrl.setValue(moment().endOf('day'));
  }
  
  public changeTo120DayRange(): void {
    this.selectedRange.setValue('120');
    this.startDateCtrl.setValue(moment().subtract(120, 'days').startOf('day'));
    this.endDateCtrl.setValue(moment().endOf('day'));
  }
  
  public changeTo360DayRange(): void {
    this.selectedRange.setValue('360');
    this.startDateCtrl.setValue(moment().subtract(360, 'days').startOf('day'));
    this.endDateCtrl.setValue(moment().endOf('day'));
  }

  private emitRangeChange(): void {
    const { startDate, endDate, isCompareEnabled, compareStartDate, compareEndDate } = this.formRange.value;
    
    if (this.isCompareEnabled) {
      this.rangeChange.emit({
        startDate,
        endDate,
        isCompareEnabled,
        compareStartDate: compareStartDate,
        compareEndDate: compareEndDate
      });
    } else {
      this.rangeChange.emit({
        startDate,
        endDate,
        isCompareEnabled
      });
    }
  }
  
}
