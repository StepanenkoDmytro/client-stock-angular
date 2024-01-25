import { ISpending } from "../domain/spending.domain";

export interface IUSer {
    spendingsHistory: ISpending[],
}