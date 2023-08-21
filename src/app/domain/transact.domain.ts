export interface ITransact {
    accountID: number;
    transactionType: string;
    amount: number;
    source: string;
    status: string;
    reasonCode: string;
    purchaseDetails: string;
    created: Date;
}