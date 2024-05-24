import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { IconComponent } from '../../../../../core/UI/components/icon/icon.component';
import { ICategoryStatistic } from '../../../../statistic/model/SpendindStatistic';
import { Category } from '../../../../../domain/category.domain';

@Component({
  selector: 'pgz-category-spending-card',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './category-spending-card.component.html',
  styleUrl: './category-spending-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategorySpendingCardComponent implements OnInit {
  @Input()
  public data: ICategoryStatistic;

  public dataChildrens: Category[];

  public ngOnInit(): void {
    this.dataChildrens = this.data.category.children;
  }
}
