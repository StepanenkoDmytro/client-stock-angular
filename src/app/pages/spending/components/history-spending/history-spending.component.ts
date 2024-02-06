import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import moment from 'moment';
import { ICategorizedSpendings } from '../../../../domain/spending.domain';
import { HistorySpendingCardComponent } from './history-spending-card/history-spending-card.component';
import { SpendingsService } from '../../../../service/spendings.service';
import { Spending } from '../../model/Spending';


const UI_COMPONENTS = [
  HistorySpendingCardComponent,
];

const MATERIAL_MODULES = [
  MatIconModule,
];


@Component({
  selector: 'pgz-history-spending',
  standalone: true,
  imports: [...UI_COMPONENTS, ...MATERIAL_MODULES],
  templateUrl: './history-spending.component.html',
  styleUrl: './history-spending.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistorySpendingComponent implements OnInit {
  public spendings: Spending[];
  public categoriesSpendings: ICategorizedSpendings;

  constructor(
    public spendingsService: SpendingsService,
  ) { }

  public ngOnInit(): void {
    this.spendingsService.loadByCurrentMonth().subscribe(spendings => {
      this.spendings = spendings;
      this.categoriesSpendings = this.categorizeSpendings(this.spendings);
    });
    
  }

  private categorizeSpendings(spendings: Spending[]): ICategorizedSpendings {
    const today = moment().startOf('day');

    const lastWeek = moment().subtract(7, 'days').startOf('day');

    const categorizedSpendings: ICategorizedSpendings = {
      today: [],
      lastWeek: [],
      month: [],
    };

    spendings.forEach(spending => {
      const spendingDate = moment(spending.date);

      if (spendingDate.isSame(today, 'day')) {
        categorizedSpendings.today.push(spending);
      } else if (spendingDate.isAfter(lastWeek, 'day')) {
        categorizedSpendings.lastWeek.push(spending);
      } else {
        categorizedSpendings.month.push(spending);
      }
    });
    
    return categorizedSpendings;
  }
}
