import { Category } from "../../../domain/category.domain";

export interface ICategoryStatistic {
    category: Category,
    value: number,
}