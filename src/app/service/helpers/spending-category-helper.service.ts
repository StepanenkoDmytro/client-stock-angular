import { Injectable } from '@angular/core';
import { Category } from '../../domain/category.domain';
import { SimpleDataModel } from '../../domain/d3.domain';
import { Spending } from '../../pages/spending/model/Spending';
import { ICategoryStatistic } from '../../pages/statistic/model/SpendindStatistic';
import { SpendingsService } from '../spendings.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SpendingCategoryHelperService {

  constructor(
    private spendingService: SpendingsService
  ) { }

  public mapCategoryDataToChartData(categoryData: ICategoryStatistic[]): SimpleDataModel[] {
    const totalCostByRange = categoryData
                                      .map(data => parseFloat(data.value.toString()))
                                      .reduce((accumulator, currentValue) => accumulator + currentValue, 0);
                                      
    return categoryData.map(data => ({
      ...data,
      name: data.category.title,
      value: parseFloat(((data.value / totalCostByRange) * 100).toFixed(2))
    }));
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


//   public async calculateCategoryStatistic(spendings: Spending[]): Promise<ICategoryStatistic[]> {
//     const categoriesList = await firstValueFrom(this.spendingService.getAllCategories());
//     const categoryMap = this.buildCategoryMap(categoriesList);

//     const result: ICategoryStatistic[] = [];

//     for (const [categoryTitle, startCost] of categoryMap) {
//         const category = this.findCategoryByIdRecursive(categoryTitle, categoriesList);
//         if (category) {
//             const categoryStatistic = this.calculateCategoryStatisticRecursive(category, spendings);
//             result.push(categoryStatistic);
//         }
//     }

//     return result;
// }

// private calculateCategoryStatisticRecursive(category: Category, spendings: Spending[]): ICategoryStatistic {
//     const spendingsByCategory = spendings.filter(spending => spending.category.id === category.id);
//     const costByCategory = spendingsByCategory
//         .map(spending => spending.cost)
//         .reduce((accumulator, value) => accumulator + value, 0);

//     const childrenStatistics: ICategoryStatistic[] = [];
//     let childrenTotalCost = 0;

//     if (category.children && category.children.length > 0) {
//         for (const childCategory of category.children) {
//           const childStatistic = this.calculateCategoryStatisticRecursive(childCategory, spendings);
//           childrenStatistics.push(childStatistic);
//           childrenTotalCost += childStatistic.value;
//         }
//     }

//     const totalCost = costByCategory + childrenTotalCost;

//     return {
//       category: category,
//       value: totalCost,
//       children: childrenStatistics.length > 0 ? childrenStatistics : undefined,
//     };
// }

//   private buildCategoryMap(categories: Category[]): Map<string, number> {
//     const resultMap = new Map<string, number>();

//     categories[1].children.forEach(category => {
//       resultMap.set(category.id, 0);
//     });

//     return resultMap;
//   }

//   private findCategoryByIdRecursive(id: string, categories: Category[]): Category | undefined {
//     for (const category of categories) {
//       if (category.id === id) {
//         return category;
//       }
//       const foundInChildren = this.findCategoryByIdRecursive(id, category.children);
//       if (foundInChildren) {
//         return foundInChildren;
//       }
//     }
//     return undefined;
//   }
public async calculateCategoryStatistic(spendings: Spending[]): Promise<ICategoryStatistic[]> {
  const categoriesList = await firstValueFrom(this.spendingService.getAllCategories());
  const spendingCategoriesList = categoriesList[1].children;

  return spendingCategoriesList.map(category => this.calculateCategoryStatisticRecursive(category, spendings));
}

private calculateCategoryStatisticRecursive(category: Category, spendings: Spending[]): ICategoryStatistic {
  const spendingsByCategory = spendings.filter(spending => spending.category.id === category.id);
  const costByCategory = spendingsByCategory.reduce((accumulator, spending) => accumulator + spending.cost, 0);

  const childrenStatistics = category.children?.map(childCategory => 
      this.calculateCategoryStatisticRecursive(childCategory, spendings)
  ) || [];

  const childrenTotalCost = childrenStatistics.reduce((acc, childStat) => acc + childStat.value, 0);
  const totalCost = costByCategory + childrenTotalCost;

  return {
    category: category,
    value: totalCost,
    children: childrenStatistics.length > 0 ? childrenStatistics : undefined,
  };
}

}
