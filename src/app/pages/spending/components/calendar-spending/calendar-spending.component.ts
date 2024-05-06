import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CalendarComponent } from '../../../../core/UI/calendar/calendar.component';
import { SelectorComponent } from '../../../../core/UI/calendar/selector/selector.component';
import { switchMap } from 'rxjs';
import { DateService } from '../../../../service/date.service';
import { SpendingsService } from '../../../../service/spendings.service';
import { HistorySpendingCardComponent } from '../history-spending/history-spending-card/history-spending-card.component';
import { Spending } from '../../model/Spending';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

const UI_COMPONENTS = [
  CalendarComponent,
  SelectorComponent,
  HistorySpendingCardComponent
];

const MATERIAL_COMPONENTS = [
  MatIconModule
];

@Component({
  selector: 'pgz-calendar-spending',
  standalone: true,
  imports: [...UI_COMPONENTS, ...MATERIAL_COMPONENTS, RouterModule],
  templateUrl: './calendar-spending.component.html',
  styleUrl: './calendar-spending.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarSpendingComponent implements OnInit {

  public spendingsByDay: Spending[];

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
