import { Category } from "../../../domain/category.domain";
import { ISpending } from "../../../domain/spending.domain";
import { v4 as uuidv4 } from 'uuid';

export const DEFAULT_SPENDING_CURRENCY = 'USD';

export interface ISpendingApi {
    id: string,
    isSaved: boolean,
    category: string,
    comment: string,
    cost: number,
    date: Date,
    currency: string,
}

export class Spending implements ISpending {
    public readonly id: string;

    constructor(
        public isSaved: boolean = false,
        public category: Category,
        public comment: string,
        public cost: number,
        public date: Date,
        id?: string,
        public currency: string = DEFAULT_SPENDING_CURRENCY,
    ) {
        if(!!id) {
            this.id = id;
        } else {
            this.id = uuidv4();
        }
    }

    public static mapToSpendingApi(spending: Spending): ISpendingApi {
        return {
            id: spending.id,
            isSaved: spending.isSaved,
            category: spending.category.id,
            comment: spending.comment,
            cost: spending.cost,
            date: spending.date,
            currency: spending.currency ?? DEFAULT_SPENDING_CURRENCY,
        }
    }

    public static mapFromSpendingApi(spending: any, categories: Category[]): Spending {
        const categoryId = spending.category;
        const category = Category.findCategoryById(categoryId, categories);

        if (!category) {
            throw new Error(`Category with title "${categoryId}" not found.`);
        }

        const mappedSpending: Spending = {
            id: spending.id,
            isSaved: spending.isSaved,
            category: category,
            comment: spending.comment,
            cost: spending.cost,
            date: spending.date,
            currency: typeof spending.currency === 'string' && spending.currency.length > 0
                ? spending.currency
                : DEFAULT_SPENDING_CURRENCY,
        };

        return mappedSpending;
    }
 }
