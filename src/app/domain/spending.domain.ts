import { Category } from './category.domain';

export interface ISpending {
    id?: number;
    category: Category;
    title: string;
    cost: number;
    date: Date;
}

export interface ICategorizedSpendings {
    today: ISpending[];
    lastWeek: ISpending[];
    month: ISpending[];
}
