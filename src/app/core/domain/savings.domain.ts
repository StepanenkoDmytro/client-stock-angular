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