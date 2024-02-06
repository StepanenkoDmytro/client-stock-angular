import { Spending } from '../pages/spending/model/Spending';
import { Category } from './category.domain';

export interface ISpending {
    id?: string;
    category: Category;
    title: string;
    cost: number;
    date: Date;
}

export interface ICategorizedSpendings {
    today: Spending[];
    lastWeek: Spending[];
    month: Spending[];
}
