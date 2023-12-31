import { Route } from '@angular/router';
import { SpendingComponent } from './spending.component';
import { AddSpendingComponent } from './components/add-spending/add-spending.component';


export const SPENDING_ROUTES: Route[] = [
  {
    path: '',
    component: SpendingComponent,
  },
  {
    path: 'add',
    component: AddSpendingComponent,
  }
];
