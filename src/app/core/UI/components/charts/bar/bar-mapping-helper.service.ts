import { Injectable } from '@angular/core';
import { IBarData, IMonthlySpending } from '../../../../../domain/statistic.domain';

@Injectable({
  providedIn: 'root'
})
export class BarMappingHelperService {
  private readonly barData: IBarData[] = [
    { name: 'Jan', value: 0 },
    { name: 'null', value: 0 },
    { name: 'Mar', value: 0 },
    { name: 'null1', value: 0 },
    { name: 'May', value: 0 },
    { name: 'null2', value: 0 },
    { name: 'July', value: 0 },
    { name: 'null3', value: 0 },
    { name: 'Sep', value: 0 },
    { name: 'null4', value: 0 },
    { name: 'Nov', value: 0 },
    { name: 'null5', value: 0 },
  ];

  public spendingHistoryMapToBarValues(monthStatistic: IMonthlySpending[]): IBarData[] {
    const createBarData: IBarData[] = this.barData.map((month, index) => ({
      ...month,
      value: monthStatistic[index]?.totalAmount || 0
    }));
    
    return createBarData;
  }
}
