import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Route, RouterModule } from '@angular/router';
import { SavingsContainerComponent } from './components/savings-container/savings-container.component';
import { SavingsStocksComponent } from './components/savings-stocks/savings-stocks.component';

const ROUTES: Route[] = [
  {
    path: '',
    component: SavingsContainerComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'stock' },
      { path: 'stock', component: SavingsStocksComponent },
    ]
  }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(ROUTES),
  ],
  exports: [
    RouterModule
  ]
})
export class SavingsRoutingModule { }
