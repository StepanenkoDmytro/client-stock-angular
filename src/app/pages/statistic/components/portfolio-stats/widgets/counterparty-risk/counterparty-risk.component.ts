import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { AssetClass } from '../../../../../../domain/asset-class.domain';
import { InstrumentService } from '../../../../../savings/service/instrument.service';
import {
  CounterpartyRiskLevel,
  CustodyMix,
} from '../../../../model/risk-stats.helper';
import { selectCustodyMixForClass } from '../../../../model/risk-stats.selectors';

/**
 * W4 — Crypto custody mix. Self-custody vs on-exchange share of the
 * user's crypto holdings, with threshold-based copy (low / amber / red).
 *
 * <p>Hidden when the user has zero CRYPTO holdings — for stock-only or
 * cash-only portfolios this widget is irrelevant noise. The portfolio
 * stats container layout collapses around the absent block via CSS gap.
 *
 * <p>Source spec: `docs/notes/2026-05-stats-2-risk-widgets.md` §5 W4.
 */
@Component({
  selector: 'pgz-counterparty-risk',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './counterparty-risk.component.html',
  styleUrl: './counterparty-risk.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CounterpartyRiskComponent {
  private readonly store = inject(Store);
  private readonly instrumentService = inject(InstrumentService);

  /**
   * CustodyMix for CRYPTO, recomputed whenever holdings / accounts /
   * instruments change. `null` when there are no crypto holdings —
   * template gates rendering on that.
   */
  public readonly mix = toSignal(
    this.store.select(
      selectCustodyMixForClass(AssetClass.CRYPTO, this.instrumentService.instruments()),
    ),
    { initialValue: null as CustodyMix | null },
  );

  public readonly hasMix = computed(() => this.mix() !== null);

  public readonly bannerCopy = computed<string>(() => {
    const m = this.mix();
    if (!m) return '';
    const pct = this.formatPct(m.exchangeRatio);
    switch (m.riskLevel) {
      case 'low':
        return 'Healthy custody balance.';
      case 'amber':
        return `${pct} on exchange — typical advice is under 30%.`;
      case 'red':
        return `${pct} on exchange — consider moving more to self-custody.`;
    }
  });

  public readonly bannerLevel = computed<CounterpartyRiskLevel>(
    () => this.mix()?.riskLevel ?? 'low',
  );

  public formatMoney(n: number): string {
    return `$${Math.round(n).toLocaleString('en-US')}`;
  }

  public formatPct(share: number): string {
    const pct = share * 100;
    return pct >= 1 ? `${Math.round(pct)}%` : '<1%';
  }

  public barWidth(share: number): number {
    return Math.max(2, Math.round(share * 100));
  }

  /** Truncate the displayed account name list to 3 entries + ellipsis. */
  public accountList(names: ReadonlyArray<string>): string {
    if (names.length === 0) return '—';
    if (names.length <= 3) return names.join(' · ');
    return `${names.slice(0, 3).join(' · ')} · +${names.length - 3} more`;
  }
}
