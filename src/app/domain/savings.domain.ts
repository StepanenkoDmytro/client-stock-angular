export interface IPortfolioStock {
    symbol: string;
    assetType: string;
    name: string;
    currency: string;
    buyPrice: number;
    countStocks: number;
    sector: string;
    dividendYield: number;
    icon?: string;
}

export interface IAsset {
    symbol: string;
    name: string;
    assetType: string;
    price: number;
  }
