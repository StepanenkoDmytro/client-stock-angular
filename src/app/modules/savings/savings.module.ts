import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SavingsContainerComponent } from './components/savings-container/savings-container.component';
import { SavingsStocksComponent } from './components/savings-stocks/savings-stocks.component';
import { SavingsRoutingModule } from './savings-routing.module';
import { UiModule } from '../ui/ui.module';
import { StockCardComponent } from './components/savings-stocks/stock-card/stock-card.component';
import { SpendingsComponent } from './spendings/spendings.component';
import { SpendingCardComponent } from './spendings/spending-card/spending-card.component';


@NgModule({
  declarations: [
    SavingsContainerComponent,
    SavingsStocksComponent,
    StockCardComponent,
    SpendingsComponent,
    SpendingCardComponent,
  ],
  imports: [
    CommonModule,
    UiModule,
    SavingsRoutingModule
  ],
})
export class SavingsModule { }
