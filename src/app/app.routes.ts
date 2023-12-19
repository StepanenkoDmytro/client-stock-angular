import { Routes } from '@angular/router';

export const enum AppRoutes {
 SPENDING = 'spending',
 CALENDAR = 'spending/calendar',
 SAVINGS = 'savings',
 PROFILE = 'profile',
}

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: AppRoutes.SPENDING},
  { path: AppRoutes.SPENDING, loadComponent: () => import('./pages/spending/spending.component').then(c => c.SpendingComponent) },
  { path: AppRoutes.CALENDAR, loadComponent: () => import('./pages/spending/components/calendar-spending/calendar-spending.component').then(c => c.CalendarSpendingComponent) },
  { path: AppRoutes.SAVINGS, loadComponent: () => import('./pages/savings/savings.component').then(c => c.SavingsComponent) },
  { path: AppRoutes.PROFILE, loadComponent: () => import('./pages/profile/profile.component').then(c => c.ProfileComponent) },
  { path: '**', loadComponent: () => import('./pages/not-found/not-found.component').then(c => c.NotFoundComponent) },
];
