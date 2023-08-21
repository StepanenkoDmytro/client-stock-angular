import { IAccountStock } from "./account.domain";
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
];

export const ACCOUNT_TRANSACTION_MOCK: ITransact[] = [
    {
        accountID: 1,
        transactionType: "BUY_STOCKS",
        amount: 2600.20,
        source: "BIG BANK",
        status: "success",
        reasonCode: "BUY_STOCKS_SUCCESS",
        purchaseDetails: "Tesla Inc",
        created: new Date("2023-07-22 08:43:59"),
    },
    {
        accountID: 1,
        transactionType: "BUY_STOCKS",
        amount: 3198.00,
        source: "BIG BANK",
        status: "success",
        reasonCode: "BUY_STOCKS_SUCCESS",
        purchaseDetails: "Tesla Inc",
        created: new Date("2023-07-22 08:43:59"),
    },
];