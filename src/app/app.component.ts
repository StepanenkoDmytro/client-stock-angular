import { Component } from '@angular/core';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'archiveAssets';

  public menuItemsMarkets = [
    {
      link: '/coin-market',
      title: 'Coin Market'
    },
    {
      link: '/stock-market',
      title: 'Stock Market'
    }
  ];

  public menuItemsPortfolio = [
    {
      link: '/portfolio-overview',
      icon: '/icons/portfolioOverviewIcon.svg',
      title: 'Portfolio Overview'
    },
    {
      link: '/crypto-portfolio',
      icon: '/icons/cryptoPortfolioIcon.svg',
      title: 'Crypto Portfolio'
    },
    {
      link: '/stock-portfolio',
      icon: '/icons/stockPortfolioIcon.svg',
      title: 'Stock Portfolio'
    },
    // {
    //     link: '/account/transfer',
    //     icon: '/icons/transfersMoneyIcon.svg',
    //     title: 'Transfers Money'
    // },
    {
      link: '/transactions-portfolio',
      icon: '/icons/transactionsIcon.svg',
      title: 'Transactions'
    },
    {
      link: '/user-portfolio',
      icon: '/icons/userSettingsIcon.svg',
      title: 'User Settings'
    }
  ]

}
