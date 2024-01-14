import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { BarComponent } from '../../../core/UI/components/charts/bar/bar.component';
import { ExpenseService } from '../../../service/expense.service';
import { ISpending } from '../../../domain/spending.domain';
import { HistorySpendingCardComponent } from '../../spending/components/history-spending/history-spending-card/history-spending-card.component';
import { IBarData, IMonthlySpending, ISpendingHistory } from '../../../domain/statistic.domain';
import { BarMappingHelperService } from '../../../core/UI/components/charts/bar/bar-mapping-helper.service';
import { BehaviorSubject } from 'rxjs';
import { AsyncPipe } from '@angular/common';


const UI_COMPONENTS = [
  BarComponent,
  HistorySpendingCardComponent,
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
    private expenseService: ExpenseService,
    private barMappingService: BarMappingHelperService,
    private cdr: ChangeDetectorRef,
  ) { }

  public ngOnInit(): void {
    this.spendingHistory = this.expenseService.generateSpendingHistory();
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

  public loadSpendingByMonth(year: number, month: number): ISpending[] {
    if(!month) {
      return [];
    }
    return this.expenseService.loadByMonth(year, month);
  }

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
