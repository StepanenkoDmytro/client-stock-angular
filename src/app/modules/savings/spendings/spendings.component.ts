import { Component } from '@angular/core';
import { SPENDING_MOCK } from '../mock.domain';
import { ISpending } from 'src/app/domain/portfolio.domain';
import * as moment from 'moment';

interface CategorizedSpendings {
  today: ISpending[];
  lastWeek: ISpending[];
  month: ISpending[];
}

@Component({
  selector: 'app-spendings',
  templateUrl: './spendings.component.html',
  styleUrls: ['./spendings.component.scss'],
})
export class SpendingsComponent {
  public isSpendingsFrame: boolean = true;
  public stocksMock = SPENDING_MOCK;
  public spendings: ISpending[] = [
    {
      icon: 'assets/expend/pet.svg',
      title: 'Pet',
      cost: 10,
      date: moment().toDate(),
    },
    {
      icon: 'assets/expend/pet.svg',
      title: 'Pet',
      cost: 10,
      date: moment().subtract(7, 'days').toDate(),
    },
    {
      icon: 'assets/expend/pet.svg',
      title: 'Pet',
      cost: 10,
      date: moment().subtract(1, 'month').toDate(),
    },
  ];
  public categoriesSpendings: CategorizedSpendings = this.categorizeSpendings(
    this.spendings
  );

  public onChangeFrame(frame: boolean): void {
    this.isSpendingsFrame = frame;
  }

  private categorizeSpendings(spendings: ISpending[]): CategorizedSpendings {
    const today = moment();

    const lastWeek = today.subtract(7, 'days');
    const startOfMonth = moment().subtract(1, 'month');

    const categorizedSpendings: CategorizedSpendings = {
      today: [],
      lastWeek: [],
      month: [],
    };

    spendings.forEach(spending => {
      const spendingDate = moment(spending.date);

      if (spendingDate.isSame(today, 'day')) {
        categorizedSpendings.today.push(spending);
      } else if (spendingDate.isBefore(lastWeek, 'day')) {
        categorizedSpendings.lastWeek.push(spending);
      } else {
        categorizedSpendings.month.push(spending);
      }
    });
    return categorizedSpendings;
  }
}
