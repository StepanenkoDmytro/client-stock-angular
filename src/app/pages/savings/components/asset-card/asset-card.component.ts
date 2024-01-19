import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { IAsset } from '../../../../domain/savings.domain';
import { MoneyPipe } from '../../../../pipe/money.pipe';
import { MatIconModule } from '@angular/material/icon';
import { IconComponent } from '../../../../core/UI/components/icon/icon.component';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'pgz-asset-card',
  standalone: true,
  imports: [MoneyPipe, MatIconModule, IconComponent, MatMenuModule],
  templateUrl: './asset-card.component.html',
  styleUrl: './asset-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssetCardComponent {
  @Input()
  public asset: IAsset;

  @Output()
  public deleteAsset: EventEmitter<IAsset> = new EventEmitter<IAsset>();
  @Output()
  public editAsset: EventEmitter<IAsset> = new EventEmitter<IAsset>();

  public onDelete(): void {
    this.deleteAsset.emit(this.asset);
  }

  public onEdit(): void {
    this.editAsset.emit(this.asset);
  }
}
