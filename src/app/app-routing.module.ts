import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StockPortfolioComponent } from './pages/stock-portfolio/stock-portfolio.component';

const routes: Routes = [
  { path: 'stock-portfolio', component: StockPortfolioComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
