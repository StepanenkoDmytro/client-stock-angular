import { IAsset } from "../domain/savings.domain";
import { ISpending } from "../domain/spending.domain";

export interface IUSer {
    spendingsHistory: ISpending[],
    assetsList: IAsset[],
}