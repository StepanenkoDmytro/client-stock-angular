export interface ISpendingHistory {
    years: IYearSpending[];
}
  
export interface IYearSpending {
    year: number;
    monthlyExpenses: IMonthlySpending[];
}

export interface IMonthlySpending {
    month: number;
    totalAmount: number;
}

export interface IBarData {
    name: string;
    value: number;
}
