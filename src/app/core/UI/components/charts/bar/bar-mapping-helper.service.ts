import { Injectable } from '@angular/core';
import { IBarData, IMonthlySpending, MOCK_BAR_DATA } from '../../../../../domain/statistic.domain';

@Injectable({
  providedIn: 'root'
})
export class BarMappingHelperService {
  
  public spendingHistoryMapToBarValues(monthStatistic: IMonthlySpending[] = []): IBarData[] {
    const createBarData: IBarData[] = MOCK_BAR_DATA.map((month, index) => ({
      ...month,
      value: monthStatistic[index]?.totalAmount || 0
    }));
    
    return createBarData;
  }
}
