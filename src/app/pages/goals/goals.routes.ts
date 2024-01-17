import { Route } from '@angular/router';
import { GoalsComponent } from './goals.component';
import { AddGoalComponent } from './components/add-goal/add-goal.component';


export const GOALS_ROUTES: Route[] = [
  {
    path: '',
    component: GoalsComponent,
  },
  {
    path: 'add',
    component: AddGoalComponent,
  }
];
