import { Route } from '@angular/router';
import { StatisticDetailComponent } from './components/spending-statistic/statistic-detail/statistic-detail.component';
import { StatisticComponent } from './statistic.component';

export const STATISTIC_ROUTES: Route[] = [
    {
        path: '',
        component: StatisticComponent,
    },
    { 
        path: 'details/:id', 
        component: StatisticComponent,
    }
];
