import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { BarComponent } from '../../../core/UI/components/charts/bar/bar.component';
import { ExpenseService } from '../../../service/expense.service';
import { ISpending, ISpendingHistory } from '../../../domain/spending.domain';
import { HistorySpendingCardComponent } from '../../spending/components/history-spending/history-spending-card/history-spending-card.component';


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
export class SpendingStatisticComponent implements OnInit {

  public years: string[] = ['2022', '2023', '2024']; // Додайте необхідні роки
  public months: string[] = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  public spendingHistory: ISpendingHistory;

  constructor(
    private expenseService: ExpenseService
  ) { }

  public ngOnInit(): void {
    this.spendingHistory = this.expenseService.generateSpendingHistory();
    this.years = this.spendingHistory.years.map(yearSpending => yearSpending.year.toString());
  }

  public trackYear(year: string): string {
    return year;
  }

  public loadSpendingByMonth(year: number, month: number): ISpending[] {
    if(!month) {
      return [];
    }
    
    return this.expenseService.loadByMonth(year, month);
  }
}
