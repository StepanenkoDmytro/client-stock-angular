import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import moment from 'moment';
import { ICategorizedSpendings, ISpending } from '../../../../core/domain/spending.domain';
import { HistorySpendingCardComponent } from './history-spending-card/history-spending-card.component';


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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistorySpendingComponent {
  public spendings: ISpending[] = [
    {
      id: 1,
      icon: 'assets/expend/pet.svg',
      title: 'Pet',
      cost: 10,
      date: moment().toDate(),
    },
    {
      id: 2,
      icon: 'assets/expend/clothes.svg',
      title: 'T-shirt',
      cost: 50,
      date: moment().toDate(),
    },
    {
      id: 3,
      icon: 'assets/expend/pet.svg',
      title: 'Pet',
      cost: 10,
      date: moment().subtract(6, 'days').toDate(),
    },
    {
      id: 4,
      icon: 'assets/expend/clothes.svg',
      title: 'T-shirt',
      cost: 50,
      date: moment().subtract(5, 'days').toDate(),
    },
    {
      id: 5,
      icon: 'assets/expend/pet.svg',
      title: 'Pet',
      cost: 10,
      date: moment().subtract(1, 'month').toDate(),
    },
  ];
  public categoriesSpendings: ICategorizedSpendings = this.categorizeSpendings(
    this.spendings
  );

  private categorizeSpendings(spendings: ISpending[]): ICategorizedSpendings {
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
