import { IAsset, ICoin, IMarket, IPortfolioCrypto } from "../../../../../../domain/savings.domain";

export class PortfolioCoin implements IAsset {
    id: string;
    symbol: string;
    name: string;
    assetType: string;
    price: number;
    count?: number;
    buyPrice?: number;

    static mapICoinToPortfolioCoin(coin: ICoin): PortfolioCoin {
        return {
            id: coin.id,
            symbol: coin.symbol,
            name: coin.name,
            assetType: coin.assetType,
            price: coin.price,
        };
    }
}