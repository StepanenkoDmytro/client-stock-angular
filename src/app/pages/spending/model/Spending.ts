import { Category } from "../../../domain/category.domain";
import { ISpending } from "../../../domain/spending.domain";
import { v4 as uuidv4 } from 'uuid';

export interface ISpendingApi {
    id: string,
    isSaved: boolean,
    category: string,
    title: string,
    cost: number,
    date: Date
}

export class Spending implements ISpending {
    public readonly id: string;

    constructor(
        public isSaved: boolean = false,
        public category: Category,
        public title: string,
        public cost: number,
        public date: Date
    ) {
        this.id = uuidv4();
    }

    public static mapToSpendingApi(spending: Spending): ISpendingApi {
        return {
            id: spending.id,
            isSaved: spending.isSaved,
            category: spending.category.title,
            title: spending.title,
            cost: spending.cost,
            date: spending.date,
        }
    }

    public static mapFromSpendingApi(spending: any): Spending {
        const categoryTitle = spending.category;
        const category = Category.findCategoryInDefaultList(categoryTitle);
    
        if (!category) {
            throw new Error(`Category with title "${categoryTitle}" not found.`);
        }

        const mappedSpending: Spending = {
            id: spending.id,
            isSaved: spending.isSaved,
            category: category,
            title: spending.title,
            cost: spending.cost,
            date: spending.date
        };
        
        return mappedSpending;
    }
 }
