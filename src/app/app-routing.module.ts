import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StockPortfolioComponent } from './pages/stock-portfolio/stock-portfolio.component';
import { PortfolioComponent } from './pages/portfolio/portfolio.component';
import { StockMarketComponent } from './pages/stock-portfolio/stock-market/stock-market.component';
import { StockPageComponent } from './pages/stock-page/stock-page.component';

const routes: Routes = [
  { path: 'stock-market', component: StockMarketComponent },
  { path: 'stock-portfolio', component: StockPageComponent },
  { path: 'portfolio-overview', component: PortfolioComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
