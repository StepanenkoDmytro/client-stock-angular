import { Injectable, Type } from '@angular/core';
import { CryptoDashboardComponent } from '../components/crypto-dashboard/crypto-dashboard.component';
import { StockDashboardComponent } from '../components/stock-dashboard/stock-dashboard.component';
import { TotalDashboardComponent } from '../components/total-dashboard/total-dashboard.component';

@Injectable({
  providedIn: 'root'
})
export class SavingsDashboardsService {
  private cardMapping: { [key: string]: Type<any> } = {
    'All': TotalDashboardComponent,
    'Crypto': CryptoDashboardComponent,
    'Stock': StockDashboardComponent,
  };

  constructor() { }

  public getCardComponent(cardName: string): Type<any> | null {
    return this.cardMapping[cardName] || null;
  }
}
