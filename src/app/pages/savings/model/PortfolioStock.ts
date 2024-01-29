import { IAsset, ICompany } from "../../../domain/savings.domain";


export class PortfolioStock implements IAsset {
    symbol: string;
    name: string;
    assetType: string;
    price: number;
    count?: number;
    buyPrice?: number;
    currency: string;
    sector: string;
    dividendYield: number;
    icon?: string;

    static mapICompanyToPortfolioStock(company: ICompany): PortfolioStock {
        return {
            symbol: company.symbol,
            name: company.name,
            assetType: company.assetType,
            price: company.price,
            currency: company.currency,
            sector: company.sector,
            dividendYield: company.dividendYield,
        };
    }
}
