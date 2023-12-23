import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ISpending } from '../../../../../domain/spending.domain';


@Component({
  selector: 'pgz-history-spending-card',
  standalone: true,
  imports: [],
  templateUrl: './history-spending-card.component.html',
  styleUrl: './history-spending-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistorySpendingCardComponent {
  @Input()
  public spending: ISpending;
}
