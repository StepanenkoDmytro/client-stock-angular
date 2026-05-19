import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { InstrumentService } from '../../../../../savings/service/instrument.service';
import {
  JurisdictionBreakdown,
  JurisdictionConcentrationLevel,
  JurisdictionSegment,
} from '../../../../model/jurisdiction-stats.helper';
import { selectJurisdictionBreakdown } from '../../../../model/jurisdiction-stats.selectors';

/**
 * W6 — Jurisdiction concentration. Aggregates portfolio value by the
 * `jurisdiction` field on each account (ISO 3166-1 alpha-2) and surfaces
 * concentration risk: how much of the user's wealth sits under one
 * country's regulator.
 *
 * <p>Three banner copies driven by `JURISDICTION_THRESHOLDS`:
 *  - >95% in one country → red "X% in single jurisdiction"
 *  - >80% in one country → amber soft warn
 *  - otherwise → "Multi-jurisdiction diversification"
 *
 * <p>Special case: when >50% sits in the **Unspecified** bucket (accounts
 * with no `jurisdiction` set), the banner shifts to a soft prompt asking
 * the user to fill in the field, instead of a meaningless "low risk" or
 * a misleading "single jurisdiction".
 *
 * <p>Source spec: `docs/notes/2026-05-stats-3-jurisdiction.md` §6 W6.
 */
@Component({
  selector: 'pgz-jurisdiction-concentration',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './jurisdiction-concentration.component.html',
  styleUrl: './jurisdiction-concentration.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JurisdictionConcentrationComponent {
  private readonly store = inject(Store);
  private readonly instrumentService = inject(InstrumentService);

  public readonly breakdown = toSignal(
    this.store.select(selectJurisdictionBreakdown(this.instrumentService.instruments())),
    { initialValue: null as JurisdictionBreakdown | null },
  );

  public readonly hasData = computed(() => this.breakdown() !== null);

  public readonly bannerLevel = computed<JurisdictionConcentrationLevel>(
    () => this.breakdown()?.level ?? 'safe',
  );

  public readonly bannerCopy = computed<string>(() => {
    const b = this.breakdown();
    if (!b) return '';
    if (b.hasMostlyUnspecified) {
      return 'Add country to your accounts for jurisdictional risk insight.';
    }
    const pct = this.formatPct(b.topShareExclUnspecified);
    switch (b.level) {
      case 'red':
        return `${pct} in a single jurisdiction — single-regulator exposure.`;
      case 'amber':
        return `${pct} in one country — consider spreading across more jurisdictions.`;
      case 'safe':
        return 'Multi-jurisdiction diversification.';
    }
  });

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

  public accountList(names: ReadonlyArray<string>): string {
    if (names.length === 0) return '—';
    if (names.length <= 3) return names.join(' · ');
    return `${names.slice(0, 3).join(' · ')} · +${names.length - 3} more`;
  }

  public trackByIso(_: number, s: JurisdictionSegment): string {
    return s.iso;
  }
}
