import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { SelectorComponent } from './selector/selector.component';
import moment from 'moment';
import { DateService } from '../../../service/date.service';
import { DateFormatPipe } from './date-format.pipe';


interface Day {
  value: moment.Moment,
  active: boolean,
  disabled: boolean,
  selected: boolean
}

interface Week {
  days: Day[]
}

const UI_COMPONENTS = [
  SelectorComponent,
];

@Component({
  selector: 'pgz-calendar',
  standalone: true,
  imports: [...UI_COMPONENTS, DateFormatPipe],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarComponent implements OnInit {
  public calendar: Week[] = [];

  constructor(
    private dateService: DateService,
    private cdr: ChangeDetectorRef
  ) { }

  public ngOnInit(): void {
    this.dateService.date.subscribe(date => {
      this.generate(date);
      this.cdr.markForCheck();
    });
  }

  public generate(now: moment.Moment) {
    const startDay = now.clone().startOf('month').startOf('week');
    const endDay = now.clone().endOf('month').endOf('week');

    const date = startDay.clone().subtract(1, 'day');
    const calendar = [];

    while (date.isBefore(endDay, 'day')) {
      calendar.push({
        days: Array(7)
          .fill(0)
          .map(() => {
            const value = date.add(1, 'day').clone();
            const active = moment().isSame(value, 'date');
            const disabled = !now.isSame(value, 'month');
            const selected = now.isSame(value, 'date');

            return {
              value, active, disabled, selected
            }
          })
      })
    }
    this.calendar = calendar;
  }

  public select(day: moment.Moment) {
   this.dateService.changeDate(day);
  }
}
