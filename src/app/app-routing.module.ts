import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StockPortfolioComponent } from './pages/stock-portfolio/stock-portfolio.component';
import { PortfolioComponent } from './pages/portfolio/portfolio.component';

const routes: Routes = [
  { path: 'stock-portfolio', component: StockPortfolioComponent },
  { path: 'portfolio-overview', component: PortfolioComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
