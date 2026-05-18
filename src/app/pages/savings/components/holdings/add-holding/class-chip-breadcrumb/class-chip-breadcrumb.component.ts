import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { AssetClass } from '../../../../../../domain/asset-class.domain';
import { ADD_HOLDING_CLASS_CARDS } from '../../../../model/AddHoldingArchetype';

/**
 * Pill at the top of an archetype form showing the picked AssetClass +
 * a "change ▾" affordance to go back to the class grid (PR5b §5).
 *
 * <p>Reference: `design/savings/04-add-holding-variant-b-detailed.svg`.
 */
@Component({
  selector: 'pgz-class-chip-breadcrumb',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './class-chip-breadcrumb.component.html',
  styleUrl: './class-chip-breadcrumb.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassChipBreadcrumbComponent {
  @Input({ required: true })
  public set assetClass(value: AssetClass) {
    this._assetClass.set(value);
  }
  public get assetClass(): AssetClass {
    return this._assetClass();
  }
  private readonly _assetClass = signal<AssetClass>(AssetClass.STOCK);

  @Output() public changeRequested = new EventEmitter<void>();

  /** Card metadata for the current class (label, icon, tint). */
  public readonly card = computed(() => {
    const ac = this._assetClass();
    return ADD_HOLDING_CLASS_CARDS.find((c) => c.assetClass === ac) ?? null;
  });

  public readonly label = computed(() => this.card()?.label ?? '');
  public readonly icon = computed(() => this.card()?.icon ?? '');
  public readonly tintVar = computed(() => this.card()?.tintVar ?? '--pgz-card-border');

  public onChange(): void {
    this.changeRequested.emit();
  }
}
