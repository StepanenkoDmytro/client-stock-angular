import { Route } from '@angular/router';
import { SpendingComponent } from './spending.component';
import { AddSpendingComponent } from './components/add-spending/add-spending.component';
import { AddCategoryComponent } from './components/category-spending/add-category/add-category.component';


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
  }
];
