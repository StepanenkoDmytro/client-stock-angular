import { Route } from '@angular/router';
import { DividendScheduleComponent } from './components/dividend-schedule/dividend-schedule.component';
import { StatisticComponent } from './statistic.component';

export const STATISTIC_ROUTES: Route[] = [
  {
    path: '',
    component: StatisticComponent,
  },
  {
    path: 'dividend-schedule',
    component: DividendScheduleComponent,
  },
  {
    path: 'details/:id',
    component: StatisticComponent,
  },
];
