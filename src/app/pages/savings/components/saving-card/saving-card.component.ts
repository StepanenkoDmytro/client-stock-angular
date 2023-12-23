import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IPortfolioStock } from '../../../../domain/savings.domain';


@Component({
  selector: 'pgz-saving-card',
  standalone: true,
  imports: [],
  templateUrl: './saving-card.component.html',
  styleUrl: './saving-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SavingCardComponent {
  @Input()
  public stock: IPortfolioStock;
}
