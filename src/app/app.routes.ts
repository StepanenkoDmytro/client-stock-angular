import { Routes } from '@angular/router';

export enum AppRoutes {
 SPENDING = 'spending',
 CALENDAR = 'spending/calendar',
 SAVINGS = 'savings',
 STATISTIC = 'statistic',
 GOALS = 'goals',
 PROFILE = 'profile',
 AUTH = 'auth',
}

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: AppRoutes.SPENDING},
  { path: AppRoutes.AUTH, loadChildren: () => import('./pages/auth/auth.routes').then(c => c.AUTH_ROUTES) },
  { path: AppRoutes.SPENDING, loadChildren: () => import('./pages/spending/spending.routes').then(c => c.SPENDING_ROUTES) },
  { path: AppRoutes.SAVINGS, loadChildren: () => import('./pages/savings/savings.routes').then(c => c.SAVINGS_ROUTES) },
  { path: AppRoutes.STATISTIC, loadComponent: () => import('./pages/statistic/statistic.component').then(c => c.StatisticComponent) },
  { path: AppRoutes.GOALS, loadChildren: () => import('./pages/goals/goals.routes').then(c => c.GOALS_ROUTES) },
  { path: AppRoutes.CALENDAR, loadComponent: () => import('./pages/spending/components/calendar-spending/calendar-spending.component').then(c => c.CalendarSpendingComponent) },
  { path: AppRoutes.PROFILE, loadComponent: () => import('./pages/profile/profile.component').then(c => c.ProfileComponent) },
  { path: '**', loadComponent: () => import('./pages/not-found/not-found.component').then(c => c.NotFoundComponent) },
];
