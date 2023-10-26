import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PortfolioComponent } from './pages/portfolio/portfolio.component';
import { StockMarketComponent } from './pages/stock-portfolio/stock-market/stock-market.component';
import { StockPageComponent } from './pages/stock-page/stock-page.component';
import { MNY_WIDGET, STOCK_WIDGET } from './domain/default-widget-state.domain';
import { MnyExpendCalendarComponent } from './pages/portfolio/mny-expend-calendar/mny-expend-calendar.component';

const routes: Routes = [
  { path: 'stock-market', component: StockMarketComponent },
  { path: STOCK_WIDGET, component: StockPageComponent },
  { path: MNY_WIDGET, component: PortfolioComponent },
  { path: 'expend-calendar', component: MnyExpendCalendarComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
