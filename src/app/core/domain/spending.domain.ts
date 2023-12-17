export interface ISpending {
    id: number
    icon: string;
    title: string;
    cost: number;
    date: Date;
}

export interface ICategorizedSpendings {
    today: ISpending[];
    lastWeek: ISpending[];
    month: ISpending[];
}