import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  inject,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { PrevRouteComponent } from '../../../../../../core/UI/components/prev-route/prev-route.component';
import { AssetClass } from '../../../../../../domain/asset-class.domain';
import {
  ADD_HOLDING_CLASS_CARDS,
  ASSET_CLASS_SLUGS,
  FUTURE_CLASS_CARDS,
} from '../../../../model/AddHoldingArchetype';

/**
 * Entry-point screen for the Add Holding flow (PR5b). Renders a grid of
 * 6 asset-class cards plus a "Future classes" section with disabled
 * placeholders. Picking a card navigates to
 * `/savings/add-holding/:slug`, where `AddHoldingComponent` renders the
 * archetype form pre-filled with the chosen class.
 *
 * <p>Reference: `design/savings/04-add-holding-variant-b-detailed.svg`.
 */
@Component({
  selector: 'pgz-add-holding-class-grid',
  standalone: true,
  imports: [CommonModule, MatIconModule, PrevRouteComponent],
  templateUrl: './add-holding-class-grid.component.html',
  styleUrl: './add-holding-class-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddHoldingClassGridComponent {
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  /** Active asset classes — picking one navigates to the archetype form. */
  public readonly cards = ADD_HOLDING_CLASS_CARDS;
  /** Disabled placeholders for classes flagged FUTURE in the roadmap. */
  public readonly future = FUTURE_CLASS_CARDS;

  @Output() public classPicked = new EventEmitter<AssetClass>();

  /**
   * Default click handler when the component is used as a routed
   * standalone page. Emits {@link classPicked} so a parent can intercept
   * the picked class (and skip navigation in tests / embedded contexts).
   */
  public onPick(assetClass: AssetClass): void {
    this.classPicked.emit(assetClass);
    this.router.navigate(['/savings/add-holding', ASSET_CLASS_SLUGS[assetClass]]);
  }

  public onPickFuture(label: string): void {
    this.snackBar.open(`${label} — coming in M5+`, undefined, {
      duration: 2500,
    });
  }

  public goBack(): void {
    this.router.navigate(['/savings']);
  }
}
