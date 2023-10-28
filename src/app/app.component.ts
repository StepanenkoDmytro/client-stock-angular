import { Component } from '@angular/core';
import { INavItem, MENU_MARKET_ITEMS, MENU_PORTFOLIO_ITEMS } from './domain/app-shared.domain';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  public isSidenavOpened: boolean = false;

  public menuItemsMarkets: INavItem[] = MENU_MARKET_ITEMS;
  public menuItemsPortfolio: INavItem[] = MENU_PORTFOLIO_ITEMS;

  public switchToggleSidenav($event: boolean) {
    this.isSidenavOpened = $event;
  }
}
