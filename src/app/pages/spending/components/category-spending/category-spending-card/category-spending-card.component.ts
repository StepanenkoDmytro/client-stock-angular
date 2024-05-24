import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IconComponent } from '../../../../../core/UI/components/icon/icon.component';
import { ICategoryStatistic } from '../../../../statistic/model/SpendindStatistic';

@Component({
  selector: 'pgz-category-spending-card',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './category-spending-card.component.html',
  styleUrl: './category-spending-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategorySpendingCardComponent {
  @Input()
  public data: ICategoryStatistic;
}
