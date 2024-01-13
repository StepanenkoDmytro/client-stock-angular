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

export const MOCK_BAR_DATA: IBarData[] = [
    { name: 'Jan', value: 0 },
    { name: 'null', value: 0 },
    { name: 'Mar', value: 0 },
    { name: 'null1', value: 0 },
    { name: 'May', value: 0 },
    { name: 'null2', value: 0 },
    { name: 'July', value: 0 },
    { name: 'null3', value: 0 },
    { name: 'Sep', value: 0 },
    { name: 'null4', value: 0 },
    { name: 'Nov', value: 0 },
    { name: 'null5', value: 0 },
  ];
