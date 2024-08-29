import { Injectable } from '@angular/core';
import { Category } from '../../domain/category.domain';
import { SimpleDataModel } from '../../domain/d3.domain';
import { Spending } from '../../pages/spending/model/Spending';
import { ICategoryStatistic } from '../../pages/statistic/model/SpendindStatistic';
import { SpendingsService } from '../spendings.service';
import { firstValueFrom } from 'rxjs';
import { IDonutData } from '../../core/UI/components/charts/donut/donut.component';
import { DataValue, IMultiLineData } from '../../core/UI/components/charts/multi-line/multi-line.component';
import moment from 'moment';

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

  public mapCategoryStatisticToLineChartData(spendings: Spending[], categoryList: ICategoryStatistic[]): IMultiLineData[] {
    
    const resultArray = categoryList.map(category => {
      const spendingsByCategory: Spending[] = this.spendingService.findSpendingsByCategoryIncludeChildren(spendings, category.category);
      
      const groupedSpendings: Map<string, number> = new Map();
      spendingsByCategory.forEach(spending => {
        // const year = new Date(spending.date).getFullYear();
        // const month = new Date(spending.date).getMonth();
        // const day = new Date(spending.date).getMonth();
        
        const dayGroup = new Date(spending.date).toDateString();
        if(!groupedSpendings.has(dayGroup)) {
          groupedSpendings.set(dayGroup, spending.cost);
        } else {
          const currValue = groupedSpendings.get(dayGroup);
          groupedSpendings.set(dayGroup, currValue + spending.cost);
        }
      });
      
      const values = Array.from(groupedSpendings, ([key, value]) => ({
        date: new Date(key),
        price: value
      }));


      const result: IMultiLineData = {
        name: category.category.title,
        values: values,
      };
      return result;
    });

    return resultArray;
  }

  public calculateLineChartByChildren(name: string, children: IMultiLineData[]): IMultiLineData {
    const groupValuesMap: Map<string, number> = new Map();
    children.forEach(child => {
      child.values.forEach(value => {
        const date = value.date.toDateString();
        
        if(!groupValuesMap.has(date)) {
          groupValuesMap.set(date, value.price);
        } else {
          const currValue = groupValuesMap.get(date);
          groupValuesMap.set(date, currValue + value.price);
        }
      });
    });

    const values = Array.from(groupValuesMap, ([key, value]) => ({
      date: new Date(key),
      price: value
    }));


    const result: IMultiLineData = {
      name: name,
      values: values,
    };
    return result;
  }

  public async calculateCategoryStatistic(spendings: Spending[]): Promise<ICategoryStatistic[]> {
    const categoriesList = await firstValueFrom(this.spendingService.getAllCategories());
    const spendingCategoriesList = categoriesList[1].children;

    return spendingCategoriesList.map(category => this.calculateCategoryStatisticRecursive(category, spendings));
  }

  public async calculateCategoryStatisticByCategory(spendings: Spending[], category: Category): Promise<ICategoryStatistic[]> {
    
    const spendingCategoriesList = category.children;
    const otherCategoryValue = spendings
      .filter(spending => spending.category.title === category.title)
      .map(spending => spending.cost)
      .reduce((accumulator, currentValue) => accumulator + currentValue, 0);
    
    let otherCategory = category.children.find(child => child.title === category.title);
    if(spendingCategoriesList.length === 0) {
      otherCategory = new Category('Other', 'payment', undefined, false, 'Other');
      return [{
        category: otherCategory,
        value: otherCategoryValue,
        children: undefined
      }] as ICategoryStatistic[];
    }
    console.log(otherCategory);
    let result: ICategoryStatistic[] = spendingCategoriesList.map(cat => this.calculateCategoryStatisticRecursive(cat, spendings));
    if(spendingCategoriesList.length > 0) {
    
    const otherCategoryStatistic = result.find(stat => stat.category.title === 'Other');
    if (otherCategoryStatistic) {
        otherCategoryStatistic.value += otherCategoryValue;
    } else {
        result.push({
            category: otherCategory = new Category('Other', 'payment', undefined, false, 'Other'),
            value: otherCategoryValue,
            children: undefined
        });
    }
    }
    console.log(result);
    return result;
  }

  public getSpendingsByRange(start: moment.Moment, end: moment.Moment, spendings: Spending[]): Spending[] {

    return spendings.filter(spending => {
        const spendingDate = moment(spending.date);
        return spendingDate.isBetween(start, end, 'day', '[]');
      });
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
