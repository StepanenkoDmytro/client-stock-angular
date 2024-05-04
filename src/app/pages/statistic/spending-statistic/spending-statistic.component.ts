import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { BarComponent } from '../../../core/UI/components/charts/bar/bar.component';
import { SpendingsService } from '../../../service/spendings.service';
import { HistorySpendingCardComponent } from '../../spending/components/history-spending/history-spending-card/history-spending-card.component';
import { IBarData, IMonthlySpending, ISpendingHistory, IYearSpending } from '../../../domain/statistic.domain';
import { BarMappingHelperService } from '../../../core/UI/components/charts/bar/bar-mapping-helper.service';
import { Spending } from '../../spending/model/Spending';
import { MultiLineComponent } from '../../../core/UI/components/charts/multi-line/multi-line.component';


const UI_COMPONENTS = [
  BarComponent,
  HistorySpendingCardComponent,
  MultiLineComponent,
];

const MATERIAL_MODULES = [
  MatTabsModule,
  MatExpansionModule,
  MatIconModule
];

@Component({
  selector: 'pgz-spending-statistic',
  standalone: true,
  imports: [...UI_COMPONENTS, ...MATERIAL_MODULES],
  templateUrl: './spending-statistic.component.html',
  styleUrl: './spending-statistic.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpendingStatisticComponent implements OnInit, AfterViewInit {
  public years: string[];
  public months: string[] = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  public spendingHistory: ISpendingHistory;
  public selectedYear: number;
  public barData: IBarData[];
  
  @ViewChild('barChart', { static: false }) 
  private barChart: BarComponent;

  constructor(
    private spendingsService: SpendingsService,
    private barMappingService: BarMappingHelperService,
    private cdr: ChangeDetectorRef,
  ) { }

  public ngOnInit(): void {
    this.spendingsService.getAll().subscribe(allSpendings => {
      this.spendingHistory = this.generateSpendingHistory(allSpendings);
    });
    this.years = this.spendingHistory.years.map(yearSpending => {

      return yearSpending.year.toString();
    });

    this.selectedYear = this.spendingHistory.years.findIndex(yearSpending => {
      return yearSpending.year === new Date().getFullYear()
    });
  }

  public ngAfterViewInit(): void {
    this.setBarData(this.selectedYear);
  }

  private generateSpendingHistory(array: Spending[]): ISpendingHistory {
    const expenseHistory: ISpendingHistory = { years: [] };

    array.forEach((spending: Spending) => {
      const { year, month } = this.extractYearAndMonth(spending);

      let yearEntry = this.getOrCreateYearEntry(expenseHistory, year);
      let monthEntry = this.getOrCreateMonthEntry(yearEntry, month);

      monthEntry.totalAmount += spending.cost;
    });
    return expenseHistory;
  }

  private extractYearAndMonth(spending: Spending): { year: number; month: number } {
    const spendingDate = new Date(spending.date);
    return { year: spendingDate.getFullYear(), month: spendingDate.getMonth() + 1 };
  }

  private getOrCreateYearEntry(expenseHistory: ISpendingHistory, year: number): IYearSpending {
    let yearEntry = expenseHistory.years.find((entry) => entry.year === year);

    if (!yearEntry) {
      yearEntry = { year, monthlyExpenses: [] };
      expenseHistory.years.push(yearEntry);
    }

    return yearEntry;
  }

  private getOrCreateMonthEntry(yearEntry: IYearSpending, month: number): IMonthlySpending {
    let monthEntry = yearEntry.monthlyExpenses.find((entry) => entry.month === month);

    if (!monthEntry) {
      monthEntry = { month, totalAmount: 0 };
      yearEntry.monthlyExpenses.push(monthEntry);
    }

    return monthEntry;
  }

  // public loadSpendingByMonth(year: number, month: number): ISpending[] {
  //   if(!month) {
  //     return [];
  //   }
  //   return this.loadByMonth(year, month);
  // }

  // public loadByMonth(year: number, month: number) :ISpending[] {
  //   return this.spendingHistory.years[year].monthlyExpenses[month].month;
  // }

  // public async loadSpendingByMonth(year: number, month: number): Promise<ISpending[]> {
  //   try {
  //     const spendingList = await this.spendingsService.loadByMonth(year, month).toPromise();

  //     return spendingList;
  //   } catch (error) {
  //     console.error('Error loading spending by month:', error);
  //     return [];
  //   }
  // }

  public onTabChange(selectedYear: number): void {
    this.setBarData(selectedYear);
  }

  private setBarData(selectedYear: number): void {
    if(this.spendingHistory.years.length > 0) {
      
    const monthStatistic: IMonthlySpending[] = this.spendingHistory.years[selectedYear]?.monthlyExpenses;

    const newBarData = this.barMappingService.spendingHistoryMapToBarValues(monthStatistic);
    this.barData = newBarData;
    this.barChart.values = this.barData;
  }
  }
}
