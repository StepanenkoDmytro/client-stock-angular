import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IPortfolioStock } from '../../../../domain/savings.domain';
import { SavingCardComponent } from '../saving-card/saving-card.component';


@Component({
  selector: 'pgz-stock-saving',
  standalone: true,
  imports: [SavingCardComponent],
  templateUrl: './stock-saving.component.html',
  styleUrl: './stock-saving.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StockSavingComponent {
  @Input()
  public stocks: IPortfolioStock[];
}
