import { Injectable } from '@angular/core';
import { Category } from '../../domain/category.domain';
import { SimpleDataModel } from '../../domain/d3.domain';
import { Spending } from '../../pages/spending/model/Spending';
import { ICategoryStatistic } from '../../pages/statistic/model/SpendindStatistic';
import { SpendingsService } from '../spendings.service';
import { firstValueFrom } from 'rxjs';
import { IDonutData } from '../../core/UI/components/charts/donut/donut.component';

@Injectable({
  providedIn: 'root'
})
export class SpendingCategoryHelperService {

  constructor(
    private spendingService: SpendingsService
  ) { }

  public mapCategoryStatisticToChartData(categoryData: ICategoryStatistic[]): IDonutData {
    const totalCostByRange = categoryData
      .map(data => parseFloat(data.value.toString()))
      .reduce((accumulator, currentValue) => accumulator + currentValue, 0);

      const donutDataModel: SimpleDataModel[] = categoryData
        .map(data => ({
          ...data,
          name: data.category.title,
          value: parseFloat(((data.value / totalCostByRange) * 100).toFixed(2))
        }))
        .filter(data => data.value > 0);
                                      
    return {
      data: donutDataModel,
      totalSum: totalCostByRange
    };
  }

  public async calculateCategoryStatistic(spendings: Spending[]): Promise<ICategoryStatistic[]> {
    const categoriesList = await firstValueFrom(this.spendingService.getAllCategories());
    const spendingCategoriesList = categoriesList[1].children;

    return spendingCategoriesList.map(category => this.calculateCategoryStatisticRecursive(category, spendings));
  }

  public async calculateCategoryStatisticByCategory(spendings: Spending[], category: Category): Promise<ICategoryStatistic[]> {
    const spendingCategoriesList = category.children;

    // if(!spendingCategoriesList) {
    //   return null;
    // }
    return spendingCategoriesList.map(category => this.calculateCategoryStatisticRecursive(category, spendings));
  }

  private calculateCategoryStatisticRecursive(category: Category, spendings: Spending[]): ICategoryStatistic {
    const spendingsByCategory = spendings.filter(spending => spending.category.id === category.id);
    const costByCategory = spendingsByCategory.reduce((accumulator, spending) => accumulator + spending.cost, 0);

    const childrenStatistics = category.children 
      ? category.children.map(childCategory => 
          this.calculateCategoryStatisticRecursive(childCategory, spendings)) 
      : [];

    const childrenTotalCost = childrenStatistics.reduce((acc, childStat) => acc + childStat.value, 0);
    const totalCost = costByCategory + childrenTotalCost;

    return {
      category: category,
      value: totalCost,
      children: childrenStatistics.length > 0 ? childrenStatistics : undefined,
    };
  }

}
