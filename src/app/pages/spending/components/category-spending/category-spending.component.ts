import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Category } from '../../../../domain/category.domain';
import { CategorySpendingCardComponent } from './category-spending-card/category-spending-card.component';
import { ICategoryStatistic } from '../../../statistic/model/SpendindStatistic';

@Component({
  selector: 'pgz-category-spending',
  standalone: true,
  imports: [CategorySpendingCardComponent],
  templateUrl: './category-spending.component.html',
  styleUrl: './category-spending.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategorySpendingComponent implements OnInit {
  public spendingCategories: ICategoryStatistic[];

  private categories: Category[] = Category.defaultList[1].children;

  public ngOnInit(): void {
    console.log(this.categories);
    this.spendingCategories = this.categories.map(category => ({
      category: category,
      value: 0
    }));
  }
}
