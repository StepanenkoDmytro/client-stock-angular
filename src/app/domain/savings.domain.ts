export interface IPortfolioStock extends IAsset {
    currency: string;
    sector: string;
    dividendYield: number;
    icon?: string;
}

export interface IPortfolioCrypto extends IAsset {
    id: string,
}

export interface IAsset {
    symbol: string;
    name: string;
    assetType: string;
    price: number;
    count: number,
    buyPrice?: number;
}

export interface ICompany {
    symbol: string;
    assetType: string;
    name: string;
    price: number;
    exchange: string;
    currency: string;
    country: string;
    sector: string;
    industry: string;
    marketCapitalization: number;
    dividendYield: number;
    dividendDate: string;
    exDividendDate: string;
}

export interface ICoin {
    id: string;
    name: string;
    symbol: string;
    price: number;
    assetType: string;
    marketCapUsd: number;
}
