import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IAsset, ICoin } from '../../../../../../../domain/savings.domain';
import { MoneyPipe } from '../../../../../../../pipe/money.pipe';

@Component({
  selector: 'pgz-asset-market-card',
  standalone: true,
  imports: [MoneyPipe],
  templateUrl: './asset-market-card.component.html',
  styleUrl: './asset-market-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssetMarketCardComponent {
  @Input()
  public asset: ICoin;
  @Input()
  public isSelected: boolean = false;
}
