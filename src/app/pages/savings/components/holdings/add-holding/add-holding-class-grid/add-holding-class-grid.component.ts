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
import { NetworkStatusService } from '../../../../../../core/network/network-status.service';
import {
  AssetClass,
  isMarketBackedAssetClass,
} from '../../../../../../domain/asset-class.domain';
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
  private readonly network = inject(NetworkStatusService);

  /** Active asset classes — picking one navigates to the archetype form. */
  public readonly cards = ADD_HOLDING_CLASS_CARDS;
  /** Disabled placeholders for classes flagged FUTURE in the roadmap. */
  public readonly future = FUTURE_CLASS_CARDS;

  /**
   * Snackbar text shown when a dimmed market-backed card is tapped while
   * offline. Manual classes (CASH / DEPOSIT / REAL_ESTATE / OTHER) keep
   * working because they don't need the search endpoints (live-prices
   * doc §3 Rule 3).
   *
   * <p>Originally surfaced through `matTooltip` on the card itself, but
   * iOS Safari intercepts tap-to-show-tooltip and swallows the click on
   * the button — non-disabled cards became unresponsive too. Dropped
   * the tooltip; the snackbar from {@link #onPick} is the only hint now.
   */
  public static readonly OFFLINE_TOOLTIP =
    'Adding stocks and crypto requires an internet connection.';

  @Output() public classPicked = new EventEmitter<AssetClass>();

  /**
   * `true` when the user is offline AND the card represents a market-
   * backed class (STOCK / ETF / CRYPTO / TOKENIZED_STOCK). Used by the
   * template to dim + disable + tooltip those cards. Pure derivation —
   * the `NetworkStatusService` signal flips it as connectivity changes,
   * Angular re-runs change detection, the cards re-render.
   */
  public isCardDisabled(assetClass: AssetClass): boolean {
    return !this.network.online() && isMarketBackedAssetClass(assetClass);
  }

  /**
   * Default click handler when the component is used as a routed
   * standalone page. Emits {@link classPicked} so a parent can intercept
   * the picked class (and skip navigation in tests / embedded contexts).
   *
   * Offline + market-backed → no-op (toast); we'd 5xx out of the
   * search endpoints anyway and a typo-prone "add anyway" workflow
   * is a data-quality landmine (live-prices doc §3 Rule 3, "no escape
   * hatch").
   */
  public onPick(assetClass: AssetClass): void {
    if (this.isCardDisabled(assetClass)) {
      this.snackBar.open(
        AddHoldingClassGridComponent.OFFLINE_TOOLTIP,
        undefined,
        { duration: 2500 },
      );
      return;
    }
    this.classPicked.emit(assetClass);
    this.router.navigate(['/savings/add-holding', ASSET_CLASS_SLUGS[assetClass]]);
  }

  public onPickFuture(label: string): void {
    this.snackBar.open(`${label} — coming in M5+`, undefined, {
      duration: 2500,
    });
  }

  /**
   * Liability is a separate trackable-kind (ADR-0009 / ADR-0013), not an
   * AssetClass — but it's added from the same grid (the grid is just a
   * "what are you adding?" router). Routes to the existing liability form.
   */
  public onPickLiability(): void {
    this.router.navigate(['/savings/add-liability']);
  }

  /**
   * Looping (Strategy) is a composite trackable-kind (ADR-0013) — added from
   * the same grid. Routes to the add-loop form (mockup savings/17).
   */
  public onPickLoop(): void {
    this.router.navigate(['/savings/add-loop']);
  }

  public goBack(): void {
    this.router.navigate(['/savings']);
  }
}
