import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { InstrumentService } from '../../../../../savings/service/instrument.service';
import {
  SpofExposure,
  SpofSeverity,
} from '../../../../model/risk-stats.helper';
import { selectSpof } from '../../../../model/risk-stats.selectors';

/**
 * W5 — Single-point-of-failure warning. Highlights the largest single
 * account and how much of the user's portfolio sits there. Severity-
 * coloured copy (safe / medium / amber / red) per `SPOF_THRESHOLDS`.
 *
 * <p>Always rendered when the user has ≥1 account with holdings — even
 * `safe` is informative ("your biggest provider holds 32% — well
 * diversified"). For a brand-new empty portfolio the widget hides via
 * the `hasExposure` gate.
 *
 * <p>Source spec: `docs/notes/2026-05-stats-2-risk-widgets.md` §5 W5.
 */
@Component({
  selector: 'pgz-spof-warning',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './spof-warning.component.html',
  styleUrl: './spof-warning.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpofWarningComponent {
  private readonly store = inject(Store);
  private readonly instrumentService = inject(InstrumentService);

  public readonly exposure = toSignal(
    this.store.select(selectSpof(this.instrumentService.instruments())),
    { initialValue: null as SpofExposure | null },
  );

  public readonly hasExposure = computed(() => this.exposure() !== null);

  public readonly copy = computed<string>(() => {
    const e = this.exposure();
    if (!e) return '';
    const pct = this.formatPct(e.shareOfPortfolio);
    if (!e.hasMultipleAccounts) {
      return `All assets sit at ${e.accountName}. Spreading across providers reduces single-account risk.`;
    }
    switch (e.severity) {
      case 'safe':
        return `${e.accountName} holds ${pct} of the portfolio — well diversified.`;
      case 'medium':
        return `${e.accountName} holds ${pct} of the portfolio. Worth keeping an eye on.`;
      case 'amber':
        return `${e.accountName} holds ${pct} of the portfolio — consider spreading more.`;
      case 'red':
        return `${e.accountName} holds ${pct} of the portfolio. Heavy single-account exposure.`;
    }
  });

  public readonly severity = computed<SpofSeverity>(
    () => this.exposure()?.severity ?? 'safe',
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
}
