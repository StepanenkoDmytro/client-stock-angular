import { Injectable } from '@angular/core';
import { Category } from '../../../domain/category.domain';
import { SimpleDataModel } from '../../../domain/d3.domain';
import { Spending } from '../../spending/model/Spending';
import { ICategoryStatistic } from '../model/SpendindStatistic';

@Injectable({
  providedIn: 'root'
})
export class SpendingStatisticHelperService {

  public mapCategoryDataToChartData(categoryData: ICategoryStatistic[]): SimpleDataModel[] {
    return categoryData.map(data => ({ ...data, name: data.category.title, value: data.value }));
  }

  public spendingsMapToCategoryData(spendings: Spending[]): ICategoryStatistic[] {
    const categoryMap = new Map<string, number>();

    spendings.forEach(spending => {
      const category = spending.category.title;

      if(categoryMap.has(category)) {
        const currentTotalCost = categoryMap.get(category);
        const newTotalCost = currentTotalCost + spending.cost;

        categoryMap.set(category, newTotalCost);
      } else {
        categoryMap.set(category, spending.cost);
      }
    });

    const result: ICategoryStatistic[] = [];

    for( const [categoryTitle, totalCost] of categoryMap) {
      const category = Category.findCategoryInDefaultList(categoryTitle);
      result.push({
        category: category,
        value: totalCost,
      });
    }

    return result;
  }
}
