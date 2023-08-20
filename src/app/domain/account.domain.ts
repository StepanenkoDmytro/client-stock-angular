export interface IAccount {
    id: number,
    accountName: string,
    accountType: string,
    balance: number,
    coins: IAccountCoin[],
    stocks: IAccountStock[],
}

export interface IAccountCoin {
    idCoin: string,
    name: string,
    symbol: string,
    countCoin: number,
    avgPrice: number,
}

export interface IAccountStock {
    symbol: string,
    assetType: string,
    name: string,
    currency: string,
    buyPrice: number,
    countStocks: number,
    sector: string,
    dividendYield: number,
}

export const ACCOUNTS_MOCK: IAccount[] = [
    {
        id: 1,
        accountName: 'My Coin Wallet Agrresive',
        accountType: 'CoinWallet',
        balance: 2000,
        coins: [],
        stocks: []
    },
    {
        id: 2,
        accountName: 'My Stock Wallet Conservative',
        accountType: 'StockWallet',
        balance: 4000,
        coins: [],
        stocks: []
    }
]