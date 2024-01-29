import { ICompany } from "../../../domain/savings.domain";


export class MarketStockInfo implements ICompany {
    name: string;
    assetType: string;
    price: number;
    symbol: string;
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
