import { Route } from '@angular/router';
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
