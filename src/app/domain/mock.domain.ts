import { ICommodityTable } from "../pages/stock-portfolio/dymanic-info/dymanic-info.component";
import { IAccountStock } from "./account.domain";
import { IStock } from "./assets.domain";
import { ITransact } from "./transact.domain";

export const ACCOUNT_STOCKS_MOCK: IAccountStock[] = [
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
  ]