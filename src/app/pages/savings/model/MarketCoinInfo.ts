import { ICoin } from "../../../domain/savings.domain";

export class MarketCoinInfo implements ICoin {
    id: string;
    name: string;
    symbol: string;
    price: number;
    assetType: string;
    marketCapitalization: number;
}