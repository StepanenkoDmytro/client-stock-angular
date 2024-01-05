import { Routes } from '@angular/router';

export const enum AppRoutes {
 SPENDING = 'spending',
 CALENDAR = 'spending/calendar',
 SAVINGS = 'savings',
 SAVING_STOCK = 'savings/stock',
 PROFILE = 'profile',
}

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: AppRoutes.SPENDING},
  { path: AppRoutes.SPENDING, loadComponent: () => import('./pages/spending/spending.component').then(c => c.SpendingComponent) },
  { path: AppRoutes.CALENDAR, loadComponent: () => import('./pages/spending/components/calendar-spending/calendar-spending.component').then(c => c.CalendarSpendingComponent) },
  { path: AppRoutes.SAVINGS, loadChildren: () => import('./pages/savings/savings.routes').then(c => c.SAVINGS_ROUTES) },
  { path: AppRoutes.PROFILE, loadComponent: () => import('./pages/profile/profile.component').then(c => c.ProfileComponent) },
  { path: '**', loadComponent: () => import('./pages/not-found/not-found.component').then(c => c.NotFoundComponent) },
];
