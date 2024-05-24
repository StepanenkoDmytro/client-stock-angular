import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { Category } from '../../../../domain/category.domain';
import { CategorySpendingCardComponent } from './category-spending-card/category-spending-card.component';
import { ICategoryStatistic } from '../../../statistic/model/SpendindStatistic';
import { Spending } from '../../model/Spending';
import { RouterModule } from '@angular/router';


@Component({
  selector: 'pgz-category-spending',
  standalone: true,
  imports: [CategorySpendingCardComponent, RouterModule],
  templateUrl: './category-spending.component.html',
  styleUrl: './category-spending.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategorySpendingComponent implements OnInit {
  @Input()
  public spendings: Spending[];
  public spendingCategories: ICategoryStatistic[];

  @Input()
  public categories: Category[];

  public ngOnInit(): void {
    this.spendingCategories = this.categories.map(category => ({
      category: category,
      value: 0
    }));
  }
}
