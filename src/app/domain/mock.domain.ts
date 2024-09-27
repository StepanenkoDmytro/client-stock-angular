import { IPortfolioStock } from "./savings.domain";


export const ACCOUNT_STOCKS_MOCK: IPortfolioStock[] = [
    {
      symbol: 'TSLA',
      assetType: 'COMMON STOCKS',
      name: 'Tesla Inc',
      currency: 'USD',
      buyPrice: 260.02,
      count: 10,
      sector: 'MANUFACTURING',
      dividendYield: 0,
      icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Tesla_T_symbol.svg/1200px-Tesla_T_symbol.svg.png',
      price: 260.02,
    },
    {
      symbol: 'BAC',
      assetType: 'COMMON STOCKS',
      name: 'Bank of America',
      currency: 'USD',
      buyPrice: 31.98,
      count: 100,
      sector: 'FINANCE',
      dividendYield: 0.03,
      price: 31.98,
    },
    {
      symbol: 'F',
      assetType: 'COMMON STOCKS',
      name: 'Ford Motor Company',
      currency: 'USD',
      buyPrice: 13.26,
      count: 200,
      sector: 'MANUFACTURING',
      dividendYield: 0.0426,
      price: 13.26,
    },
    {
      symbol: 'BAC',
      assetType: 'COMMON STOCKS',
      name: 'Bank of America',
      currency: 'USD',
      buyPrice: 31.98,
      count: 100,
      sector: 'FINANCE',
      dividendYield: 0.03,
      price: 31.98,
    },
    // {
    //   symbol: 'F',
    //   assetType: 'COMMON STOCKS',
    //   name: 'Ford Motor Company',
    //   currency: 'USD',
    //   buyPrice: 13.26,
    //   count: 200,
    //   sector: 'MANUFACTURING',
    //   dividendYield: 0.0426,
    // },
  ];

  export const STOCKS_MOCK: IExpend = {
    title: 'Stocks',
    money: 2000,
  };
  
  export const PROFIT_MOCK: IExpend = {
    title: 'Profit',
    money: 10000,
  };

  export interface IExpend {
    title: string;
    money: number | string;
  }
  