import { MNY_WIDGET, STOCK_WIDGET } from "./default-widget-state.domain";

export interface INavItem {
    link: string,
    icon?: string,
    title: string
}

export const MENU_MARKET_ITEMS: INavItem[] = [
    {
        link: '/coin-market',
        title: 'Coin Market'
    },
    {
        link: '/savings',
        title: 'Stock Market'
    }
];

export const MENU_PORTFOLIO_ITEMS: INavItem[] = [
    {
        link: `/${MNY_WIDGET}`,
        icon: '/icons/portfolioOverviewIcon.svg',
        title: 'Portfolio Overview'
      },
      {
        link: '/crypto-portfolio',
        icon: '/icons/cryptoPortfolioIcon.svg',
        title: 'Crypto Portfolio'
      },
      {
        link: `/${STOCK_WIDGET}`,
        icon: '/icons/stockPortfolioIcon.svg',
        title: 'Stock Portfolio'
      },
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
];