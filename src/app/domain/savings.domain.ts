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
    count?: number,
    buyPrice?: number;
}

export interface ICompany extends IMarket {
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

export interface ICoin extends IMarket {
    id: string;
    marketCapitalization: number;
}

export interface ICompanyList {
    data: IMarket[],
    totalPages: number,
    totalItems: number,
    currentPage: number
}

export interface IMarket {
    name: string;
    assetType: string;
    price: number;
    symbol: string;
}
