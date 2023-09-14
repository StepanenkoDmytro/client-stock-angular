export interface IUser {
    id: number;
    username: string;
    email: string;
    imageID?: number;
    accounts: IPortfolio[];
}

export interface IPortfolio {
    accountID: number,
    accountName: string,
    accountType: string,
    balance: number,
    contribution?: number,
    profit?: number,
    riskness?: string,
    isActive?: boolean,
    coins: IPortfolioCoin[],
    stocks: IPortfolioStock[],
}

export interface IPortfolioBasic {
    accountID: number,
    accountName: string,
    accountType: string,
    balance: number,
    contribution?: number,
    profit?: number,
    riskness?: string,
}

export interface IPortfolioCoin {
    idCoin: string,
    name: string,
    symbol: string,
    countCoin: number,
    avgPrice: number,
}

export interface IPortfolioStock {
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
