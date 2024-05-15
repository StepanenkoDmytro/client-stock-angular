import { Injectable } from '@angular/core';
import { IBarData, IMonthlySpending, MOCK_BAR_DATA } from '../../../../../domain/statistic.domain';
import { Spending } from '../../../../../pages/spending/model/Spending';
import { SimpleDataModel } from '../../../../../domain/d3.domain';
import { Title } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class ChartsHelperService {
//   export interface SimpleDataModel {
//     name: string,
//     value: string,
//     color?: string,
// }

  public spendingsMapToSimpleData(spendings: Spending[]): SimpleDataModel[] {
    const categoryMap = new Map<string, number>();

    spendings.forEach(spending => {
      const categoryTitle = spending.category.title;

      if(categoryMap.has(categoryTitle)) {
        const currentTotalCost = categoryMap.get(categoryTitle);
        const newTotalCost = currentTotalCost + spending.cost;

        categoryMap.set(categoryTitle, newTotalCost);
      } else {
        categoryMap.set(categoryTitle, spending.cost);
      }
    });

    const result: SimpleDataModel[] = [];

    for( const [title, totalCost] of categoryMap) {
      result.push({
        name: title,
        value: totalCost,
      });
    }
    
    return result;
  }
  
  public spendingHistoryMapToBarValues(monthStatistic: IMonthlySpending[] = []): IBarData[] {
    const createBarData: IBarData[] = MOCK_BAR_DATA.map((month, index) => ({
      ...month,
      value: monthStatistic[index]?.totalAmount || 0
    }));
    
    return createBarData;
  }
}
