import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CalendarComponent } from '../../../../core/UI/calendar/calendar.component';
import { SelectorComponent } from '../../../../core/UI/calendar/selector/selector.component';
import { switchMap } from 'rxjs';
import { DateService } from '../../../../service/date.service';
import { SpendingsService } from '../../../../service/spendings.service';
import { ISpending } from '../../../../domain/spending.domain';
import { HistorySpendingCardComponent } from '../history-spending/history-spending-card/history-spending-card.component';


const UI_COMPONENTS = [
  CalendarComponent,
  SelectorComponent,
  HistorySpendingCardComponent
];

@Component({
  selector: 'pgz-calendar-spending',
  standalone: true,
  imports: [...UI_COMPONENTS],
  templateUrl: './calendar-spending.component.html',
  styleUrl: './calendar-spending.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarSpendingComponent implements OnInit {

  public spendingsByDay: ISpending[];

  constructor(
    public dateService: DateService,
    private spendingsService: SpendingsService,
  ) { }

  public ngOnInit(): void {
    this.dateService.date.pipe(
      switchMap(value => this.spendingsService.loadByDate(value))
    ).subscribe(spendings => {
      this.spendingsByDay = spendings;
    });
  }
}
