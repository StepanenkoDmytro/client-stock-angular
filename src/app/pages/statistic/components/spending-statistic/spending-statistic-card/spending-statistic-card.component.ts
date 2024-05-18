import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IconComponent } from '../../../../../core/UI/components/icon/icon.component';
import { ICategoryStatistic } from '../../../model/SpendindStatistic';

@Component({
  selector: 'pgz-spending-statistic-card',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './spending-statistic-card.component.html',
  styleUrl: './spending-statistic-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpendingStatisticCardComponent {
  @Input()
  public data: ICategoryStatistic;
}
