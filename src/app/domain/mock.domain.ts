import { ElementTable } from "../pages/stock-portfolio/stock-market/stock-details/stock-details.component";
import {  IPortfolio, IPortfolioStock, IUser } from "./portfolio.domain";
import { IStock } from "./assets.domain";
import { ITransact } from "./transact.domain";
import { ICommodityTable } from "./widget.domain";


export const ACCOUNTS_MOCK: IPortfolio[] = [
    {
        accountID: 1,
        accountName: 'My Coin Wallet Agrresive',
        accountType: 'CoinWallet',
        balance: 2000,
        coins: [],
        stocks: []
    },
    {
        accountID: 2,
        accountName: 'My Stock Wallet Conservative',
        accountType: 'StockWallet',
        balance: 4000,
        coins: [],
        stocks: []
    }
];

export const ACCOUNT_STOCKS_MOCK: IPortfolioStock[] = [
    {
        symbol: "TSLA",
        assetType: "COMMON STOCKS",
        name: "Tesla Inc",
        currency: "USD",
        buyPrice: 260.02,
        countStocks: 10,
        sector: "MANUFACTURING",
        dividendYield: 0,
    },
    {
        symbol: "BAC",
        assetType: "COMMON STOCKS",
        name: "Bank of America",
        currency: "USD",
        buyPrice: 31.98,
        countStocks: 100,
        sector: "FINANCE",
        dividendYield: 0.03,
    },
    {
        symbol: "F",
        assetType: "COMMON STOCKS",
        name: "Ford Motor Company",
        currency: "USD",
        buyPrice: 13.26,
        countStocks: 200,
        sector: "MANUFACTURING",
        dividendYield: 0.0426,
    },
    {
        symbol: "BAC",
        assetType: "COMMON STOCKS",
        name: "Bank of America",
        currency: "USD",
        buyPrice: 31.98,
        countStocks: 100,
        sector: "FINANCE",
        dividendYield: 0.03,
    },
    {
        symbol: "F",
        assetType: "COMMON STOCKS",
        name: "Ford Motor Company",
        currency: "USD",
        buyPrice: 13.26,
        countStocks: 200,
        sector: "MANUFACTURING",
        dividendYield: 0.0426,
    },
];

export const ACCOUNT_TRANSACTION_MOCK: ITransact[] = [
    {
        accountID: 1,
        transactionType: "BUY STOCKS",
        amount: 2600.20,
        source: "BIG BANK",
        status: "success",
        reasonCode: "BUY_STOCKS_SUCCESS",
        purchaseDetails: "Tesla Inc",
        created: new Date("2023-07-22 08:43:59"),
    },
    {
        accountID: 1,
        transactionType: "BUY STOCKS",
        amount: 3198.00,
        source: "BIG BANK",
        status: "success",
        reasonCode: "BUY_STOCKS_SUCCESS",
        purchaseDetails: "Tesla Inc",
        created: new Date("2023-07-22 08:43:59"),
    },
    {
        accountID: 1,
        transactionType: "BUY STOCKS",
        amount: 3198.00,
        source: "BIG BANK",
        status: "success",
        reasonCode: "BUY_STOCKS_SUCCESS",
        purchaseDetails: "Tesla Inc",
        created: new Date("2023-07-22 08:43:59"),
    },
    {
        accountID: 1,
        transactionType: "BUY STOCKS",
        amount: 3198.00,
        source: "BIG BANK",
        status: "success",
        reasonCode: "BUY_STOCKS_SUCCESS",
        purchaseDetails: "Tesla Inc",
        created: new Date("2023-07-22 08:43:59"),
    },
    {
        accountID: 1,
        transactionType: "BUY STOCKS",
        amount: 3198.00,
        source: "BIG BANK",
        status: "success",
        reasonCode: "BUY_STOCKS_SUCCESS",
        purchaseDetails: "Tesla Inc",
        created: new Date("2023-07-22 08:43:59"),
    },
    {
        accountID: 1,
        transactionType: "BUY STOCKS",
        amount: 3198.00,
        source: "BIG BANK",
        status: "success",
        reasonCode: "BUY_STOCKS_SUCCESS",
        purchaseDetails: "Tesla Inc",
        created: new Date("2023-07-22 08:43:59"),
    },
];

export const STOCK_MOCK: IStock = {
    symbol: "TSLA",
    name: "Tesla Inc.",
    currency: "USD",
    country: "USA",
    sector: "MANUFACTURING",
    industry: "FINANCE",
    market_capitalization: 1000000000,
    dividend_yield: 0
}

export const COMMODITY_MOCKS: ICommodityTable[] = [
    {
      commodity: 'Crude Oil(WTI)',
      price: 76.83,
      change: 1.18,
      percentageChange: '1.56%'
    },
    {
        commodity: 'Crude Oil(Brent)',
        price: 80.89,
        change: 1.25,
        percentageChange: '1.57%'
      },
      {
        commodity: 'Natural Gas',
        price: 2.724,
        change: 0.033,
        percentageChange: '1.20%'
      },
      {
        commodity: 'Gold',
        price: 1963.90,
        change: 7.00,
        percentageChange: '0.36%'
      }
  ];

  export const PROFITS_VALUE_MOCK: ElementTable[] = [
    { property: 'Day', value: '10' },
    { property: 'Month', value: '100' },
    { property: 'Received Dividend', value: '100' },
    { property: 'Forecast Dividend', value: '50' },
  ];

  export const USER_MOCK: IUser = {
    id: 1,
    username: 'Dima',
    email: 'user@',
    accounts: [
        {
            accountID: 1,
            accountName: 'AggressiveStrategy',
            accountType: 'StockWallet',
            balance: 2000,
            contribution: 1500,
            profit: 500,
            riskness: 'Aggressive',
            coins: [],
            stocks: [
                {
                    symbol: "TSLA",
                    assetType: "COMMON STOCKS",
                    name: "Tesla Inc",
                    currency: "USD",
                    buyPrice: 260.02,
                    countStocks: 10,
                    sector: "MANUFACTURING",
                    dividendYield: 0,
                },
                {
                    symbol: "BAC",
                    assetType: "COMMON STOCKS",
                    name: "Bank of America",
                    currency: "USD",
                    buyPrice: 31.98,
                    countStocks: 100,
                    sector: "FINANCE",
                    dividendYield: 0.03,
                },
                {
                    symbol: "F",
                    assetType: "COMMON STOCKS",
                    name: "Ford Motor Company",
                    currency: "USD",
                    buyPrice: 13.26,
                    countStocks: 200,
                    sector: "MANUFACTURING",
                    dividendYield: 0.0426,
                },
                {
                    symbol: "BAC",
                    assetType: "COMMON STOCKS",
                    name: "Bank of America",
                    currency: "USD",
                    buyPrice: 31.98,
                    countStocks: 100,
                    sector: "FINANCE",
                    dividendYield: 0.03,
                },
                {
                    symbol: "F",
                    assetType: "COMMON STOCKS",
                    name: "Ford Motor Company",
                    currency: "USD",
                    buyPrice: 13.26,
                    countStocks: 200,
                    sector: "MANUFACTURING",
                    dividendYield: 0.0426,
                }
            ]
        },
        {
            accountID: 2,
            accountName: 'StocksConservative',
            accountType: 'StockWallet',
            balance: 4000,
            coins: [],
            contribution: 3800,
            profit: 200,
            riskness: 'Conservative',
            stocks: [
                {
                    symbol: "BAC",
                    assetType: "COMMON STOCKS",
                    name: "Bank of America",
                    currency: "USD",
                    buyPrice: 31.98,
                    countStocks: 100,
                    sector: "FINANCE",
                    dividendYield: 0.03,
                },
                {
                    symbol: "TSLA",
                    assetType: "COMMON STOCKS",
                    name: "Tesla Inc",
                    currency: "USD",
                    buyPrice: 260.02,
                    countStocks: 10,
                    sector: "MANUFACTURING",
                    dividendYield: 0,
                },
            ]
        }
    ]
  }
  