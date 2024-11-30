import { Route } from '@angular/router';
import { SpendingComponent } from './spending.component';
import { AddSpendingComponent } from './components/add-spending/add-spending.component';
import { AddCategoryComponent } from './components/category-spending/add-category/add-category.component';
import { SpendingStatisticComponent } from './components/spending-statistic/spending-statistic.component';


export const SPENDING_ROUTES: Route[] = [
  {
    path: '',
    component: SpendingComponent,
  },
  {
    path: 'add',
    component: AddSpendingComponent,
  },
  {
    path: 'add-category',
    component: AddCategoryComponent
  },
  {
    path: 'statistic',
    component: SpendingStatisticComponent
  }
];
