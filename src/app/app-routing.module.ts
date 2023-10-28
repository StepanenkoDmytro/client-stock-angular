import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PortfolioComponent } from './pages/portfolio/portfolio.component';
import { StockMarketComponent } from './pages/stock-portfolio/stock-market/stock-market.component';
import { StockPageComponent } from './pages/stock-page/stock-page.component';
import { MNY_WIDGET, STOCK_WIDGET } from './domain/default-widget-state.domain';
import { MnyExpendCalendarComponent } from './pages/portfolio/mny-expend-calendar/mny-expend-calendar.component';
import { MnyTargetsComponent } from './pages/portfolio/mny-targets/mny-targets.component';
import { DayViewComponent } from './pages/portfolio/mny-expend-calendar/day-view/day-view.component';
import { BudgetTrackerWrapperComponent } from './pages/portfolio/category-finances/budget-tracker-wrapper/budget-tracker-wrapper.component';
import { NotFoundComponent } from './modules/ui/components/not-found/not-found.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { JwtInterceptor } from './modules/auth/jwt.interceptor';

const routes: Routes = [
  { path: 'stock-market', component: StockMarketComponent },
  { path: STOCK_WIDGET, component: StockPageComponent },
  { path: MNY_WIDGET, component: PortfolioComponent },
  { path: 'expend-calendar', component: MnyExpendCalendarComponent },
  { path: 'savings-goals', component: MnyTargetsComponent },
  { path: 'day-view', component: DayViewComponent },
  { path: 'money-tracker', component: BudgetTrackerWrapperComponent },
  { path: 'auth', loadChildren: () => import('./modules/auth/auth.module').then(m => m.AuthModule) },
  { path: 'not-found', component: NotFoundComponent },
  { path: '**', pathMatch: 'full', redirectTo: 'not-found' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
  ]
})
export class AppRoutingModule { }
