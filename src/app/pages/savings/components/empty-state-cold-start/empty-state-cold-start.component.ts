import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  inject,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { NetworkStatusService } from '../../../../core/network/network-status.service';
import { DemoDataService } from '../../../../core/services/demo-data.service';
import {
  AssetClass,
  isMarketBackedAssetClass,
} from '../../../../domain/asset-class.domain';
import {
  ADD_HOLDING_CLASS_CARDS,
  ASSET_CLASS_SLUGS,
} from '../../model/AddHoldingArchetype';

/**
 * T1 cold-start hero per
 * `docs/notes/2026-05-savings-empty-states-ladder.md` §5.1 + frame F1
 * of `design/savings/07-empty-states.svg`. Replaces the
 * PortfolioSummary + view-toggle + class-accordion stack on `/savings`
 * when {@link SavingsTierService#tier} resolves to `T1_FIRST_VISIT` or
 * `T1_LIGHT`.
 *
 * <p>Renders a centred greeting + H1 + sub copy + a 6-card Action Grid
 * (Stocks/Crypto/Real estate/Cash/Deposit/Other — same shape as the
 * Add Holding entry-grid, intentionally divergent component for now;
 * extraction to `core/UI/` happens when a third call site appears, per
 * task §8 Q1). The «Try with demo data» link surfaces only when the
 * parent passes {@link #showDemoLink} = `true` — i.e. only on first
 * visit. Returning users (post-wipe) reach the demo through Profile
 * «Restore demo» instead (PR5).
 *
 * <p>All interactions are self-contained: card tap → router navigate
 * to the Add Holding archetype form with the class preselected;
 * Try-demo tap → {@link DemoDataService#seed} + snackbar feedback.
 * No outputs — the tier signal flips reactively as data lands and the
 * parent renders the dashboard branch instead.
 */
@Component({
  selector: 'pgz-empty-state-cold-start',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './empty-state-cold-start.component.html',
  styleUrl: './empty-state-cold-start.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateColdStartComponent {
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly network = inject(NetworkStatusService);
  private readonly demoData = inject(DemoDataService);

  /**
   * `true` to render the «↗ Try with demo data» link below the OR
   * divider. Parent (SavingsComponent) computes this from
   * `tier() === 'T1_FIRST_VISIT'` per task §4.1 — only the truly first
   * visit gets the opt-in nudge; post-wipe users (T1_LIGHT) already
   * dismissed demo data on purpose and reach the restore via Profile.
   */
  @Input() public showDemoLink = false;

  public readonly cards = ADD_HOLDING_CLASS_CARDS;

  /**
   * Market-backed cards (STOCK / ETF / CRYPTO / TOKENIZED_STOCK) need
   * the search endpoints to resolve instruments. Offline taps would
   * 5xx out of the form anyway, so dim them and short-circuit the tap
   * with a snackbar — matches the pattern in
   * {@code AddHoldingClassGridComponent} (live-prices doc §3 Rule 3).
   */
  public isCardDisabled(assetClass: AssetClass): boolean {
    return !this.network.online() && isMarketBackedAssetClass(assetClass);
  }

  public onPickClass(assetClass: AssetClass): void {
    if (this.isCardDisabled(assetClass)) {
      this.snackBar.open(
        'Adding stocks and crypto requires an internet connection.',
        undefined,
        { duration: 2500 },
      );
      return;
    }
    this.router.navigate(['/savings/add-holding', ASSET_CLASS_SLUGS[assetClass]]);
  }

  /**
   * Materialise the opt-in demo dataset (10 holdings + 7 accounts + 12
   * system tags, all `isDemo: true`) and surface a snackbar pointing
   * the user at the persistent amber banner that PR5 will wire up.
   * Tier flips to T3 reactively as the holdings dispatch lands.
   */
  public async onTryDemo(): Promise<void> {
    await this.demoData.seed();
    this.snackBar.open(
      'Demo data loaded · See banner above',
      undefined,
      { duration: 2500 },
    );
  }
}
