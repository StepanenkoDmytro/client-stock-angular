export interface INavItem {
  link: string;
  icon?: string;
  title: string;
}

export const MENU: INavItem[] = [
  {
    link: `/money-widget`,
    icon: '/icons/portfolioOverviewIcon.svg',
    title: 'Expends',
  },
  {
    link: '/savings',
    icon: '/icons/cryptoPortfolioIcon.svg',
    title: 'Savings',
  },
  {
    link: `/news`,
    icon: '/icons/stockPortfolioIcon.svg',
    title: 'News',
  },
];
