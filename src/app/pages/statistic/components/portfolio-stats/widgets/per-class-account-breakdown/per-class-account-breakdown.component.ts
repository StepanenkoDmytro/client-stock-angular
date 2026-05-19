import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { AssetClass } from '../../../../../../domain/asset-class.domain';
import { InstrumentService } from '../../../../../savings/service/instrument.service';
import { ClassBreakdown } from '../../../../model/class-account-stats.helper';
import { selectClassAccountMatrix } from '../../../../model/class-account-stats.selectors';

/**
 * W3 — "EACH CLASS — WHERE IT LIVES". One stacked-bar section per
 * AssetClass with holdings, showing how that class is distributed across
 * the user's accounts. Segments sorted desc by value within each class.
 *
 * <p>The factory selector lives at `class-account-stats.selectors.ts`
 * and takes the instruments map as input — same pattern as
 * `selectHoldingsView`. The instruments map is owned by
 * `InstrumentService` (Signal, not Store), so we re-derive the selector
 * whenever the map's identity changes.
 *
 * <p>Source spec: `docs/notes/2026-05-stats-1-account-breakdowns.md` §5 W3.
 */
@Component({
  selector: 'pgz-per-class-account-breakdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './per-class-account-breakdown.component.html',
  styleUrl: './per-class-account-breakdown.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerClassAccountBreakdownComponent {
  private readonly store = inject(Store);
  private readonly instrumentService = inject(InstrumentService);

  private readonly classes = toSignal(
    // Re-create the factory selector if the instruments map identity
    // changes (e.g. user creates a custom instrument). The inner
    // createSelector memoises on (holdings, accounts) so this is cheap.
    this.store.select(selectClassAccountMatrix(this.instrumentService.instruments())),
    { initialValue: [] as ClassBreakdown[] },
  );

  public readonly sections = computed(() => this.classes());
  public readonly hasAny = computed(() => this.sections().length > 0);

  public formatMoney(n: number): string {
    return `$${Math.round(n).toLocaleString('en-US')}`;
  }

  public formatPct(share: number): string {
    const pct = share * 100;
    return pct >= 1 ? `${Math.round(pct)}%` : '<1%';
  }

  public segmentWidthPct(share: number): number {
    return Math.max(2, Math.round(share * 100));
  }

  public classColor(ac: AssetClass): string {
    switch (ac) {
      case AssetClass.STOCK:           return 'var(--asset-stock)';
      case AssetClass.ETF:             return 'var(--asset-etf, var(--asset-stock))';
      case AssetClass.TOKENIZED_STOCK: return 'var(--asset-tokenized-stock)';
      case AssetClass.CRYPTO:          return 'var(--asset-crypto)';
      case AssetClass.CASH:            return 'var(--asset-cash)';
      case AssetClass.DEPOSIT:         return 'var(--asset-deposit)';
      case AssetClass.REAL_ESTATE:     return 'var(--asset-real-estate)';
      case AssetClass.OTHER:           return 'var(--asset-other)';
    }
  }

  /**
   * Sequential per-segment colour. Stays within the class's hue family
   * by stepping opacity — keeps the bar feeling like "one class, split
   * across N providers" instead of a rainbow.
   */
  public segmentColor(ac: AssetClass, index: number): string {
    const base = this.classColor(ac);
    const opacities = [1, 0.78, 0.6, 0.45, 0.32];
    const op = opacities[Math.min(index, opacities.length - 1)];
    return `color-mix(in srgb, ${base} ${Math.round(op * 100)}%, transparent)`;
  }

  public trackByClass(_: number, c: ClassBreakdown): string {
    return c.classKey;
  }

  public trackBySegment(_: number, s: { accountId: string }): string {
    return s.accountId;
  }
}
