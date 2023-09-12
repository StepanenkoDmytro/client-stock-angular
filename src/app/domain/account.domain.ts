export interface IUser {
    id: number;
    username: string;
    email: string;
    imageID?: number;
    accounts: IAccount[];
}

export interface IAccount {
    accountID: number,
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

export interface PurchaseData {
    countStocks: number,
    accountID: number,
    tradeType: boolean,
    typeCtrl: string
  }
