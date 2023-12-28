import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IPortfolioStock } from '../../../../../domain/savings.domain';

@Component({
  selector: 'pgz-add-asset-card',
  standalone: true,
  imports: [],
  templateUrl: './add-asset-card.component.html',
  styleUrl: './add-asset-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddAssetCardComponent {
  @Input()
  public asset: IPortfolioStock;
}
