import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IAsset } from '../../../../domain/savings.domain';
import { MoneyPipe } from '../../../../pipe/money.pipe';

@Component({
  selector: 'pgz-add-asset-card',
  standalone: true,
  imports: [MoneyPipe],
  templateUrl: './add-asset-card.component.html',
  styleUrl: './add-asset-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddAssetCardComponent {
  @Input()
  public asset: IAsset;
}
