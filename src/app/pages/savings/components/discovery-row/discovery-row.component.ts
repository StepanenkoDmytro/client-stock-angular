import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Signal,
  computed,
  inject,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { SavingsTierService } from '../../../../core/state/savings-tier.service';
import { AssetClass } from '../../../../domain/asset-class.domain';
import {
  ADD_HOLDING_CLASS_CARDS,
  ASSET_CLASS_SLUGS,
  AddHoldingClassCard,
} from '../../model/AddHoldingArchetype';
import { UserPreferencesService } from '../../service/user-preferences.service';

/**
 * T2 Discovery row per `docs/notes/2026-05-savings-empty-states-ladder.md`
 * §5.3 + frame F2 of `design/savings/07-empty-states.svg`. Surfaces the
 * top-3 asset classes the user hasn't tracked yet as soft chip
 * affordances; tap routes into the Add Holding archetype form with the
 * class preselected.
 *
 * <p>Conditional on parent: SavingsComponent renders this only when
 * {@code tier() === 'T2'} AND
 * {@link UserPreferencesService#discoveryRowHidden} is false. T3 auto-
 * hides via the tier transition (no explicit dismiss needed); the
 * ✕ Hide button writes the forever-dismiss preference so the row never
 * re-surfaces even if the user wipes a class back to T2.
 */
@Component({
  selector: 'pgz-discovery-row',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './discovery-row.component.html',
  styleUrl: './discovery-row.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiscoveryRowComponent {
  private readonly router = inject(Router);
  private readonly savingsTier = inject(SavingsTierService);
  private readonly prefs = inject(UserPreferencesService);

  /**
   * Card metadata for the 3 missing classes, in fallback-chain order
   * (Stocks → Real estate → Cash → Crypto → ETF → Deposit → Tokenized
   * → Other). Joins {@link SavingsTierService#discoveryClasses} against
   * the shared {@link ADD_HOLDING_CLASS_CARDS} catalog so labels +
   * icons + tints stay consistent with the cold-start hero grid.
   * Classes not in {@code ADD_HOLDING_CLASS_CARDS} (e.g. ETF /
   * TOKENIZED_STOCK — currently not rendered as Add Holding entry
   * cards) fall through as a synthesised stub so the chip still works.
   */
  public readonly chips: Signal<AddHoldingClassCard[]> = computed(() =>
    this.savingsTier.discoveryClasses().map(
      (assetClass) =>
        ADD_HOLDING_CLASS_CARDS.find((c) => c.assetClass === assetClass) ??
        DiscoveryRowComponent.synthChip(assetClass),
    ),
  );

  public onPickClass(assetClass: AssetClass): void {
    this.router.navigate(['/savings/add-holding', ASSET_CLASS_SLUGS[assetClass]]);
  }

  public onHide(): void {
    this.prefs.setDiscoveryRowHidden(true);
  }

  /**
   * Synthesised fallback for asset classes that aren't surfaced in the
   * Add Holding entry grid (currently ETF and TOKENIZED_STOCK — they
   * route through STOCK / CRYPTO archetypes respectively). Keeps the
   * chip rail working when the fallback chain digs that deep.
   */
  private static synthChip(assetClass: AssetClass): AddHoldingClassCard {
    return {
      assetClass,
      label: assetClass.replace(/_/g, ' ').toLowerCase(),
      subtitle: '',
      icon: 'add',
      tintVar: '--pgz-card-border',
    };
  }
}
