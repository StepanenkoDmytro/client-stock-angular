import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { accountDisplayName } from '../../../../../../domain/account-v2.domain';
import {
  IAccountWithStats,
  selectAccountsWithStats,
} from '../../../../../savings/store/accounts.selectors';
import {
  SyncDisplay,
  syncDisplayFor,
} from '../../../../../savings/model/sync-display.helper';

interface IRow {
  accountId: string;
  name: string;
  value: number;
  share: number; // 0..1 of the portfolio total
  holdingCount: number;
  sync: SyncDisplay;
}

/**
 * W2 — "VALUE BY PROVIDER". One row per account: name, cost-basis $
 * total, horizontal bar (% of portfolio), sync-status line, holdings
 * count. Footer row sums every account's value.
 *
 * <p>Sort: desc by `totalValueBaseCurrency` so the heaviest provider is
 * always at the top — same heuristic as the PortfolioSummary breakdown
 * list. Zero-value accounts still render so a freshly-added empty
 * account doesn't silently disappear from the widget.
 *
 * <p>Source spec: `docs/notes/2026-05-stats-1-account-breakdowns.md` §5 W2.
 */
@Component({
  selector: 'pgz-per-account-breakdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './per-account-breakdown.component.html',
  styleUrl: './per-account-breakdown.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerAccountBreakdownComponent {
  private readonly store = inject(Store);

  private readonly accountsWithStats = toSignal(
    this.store.select(selectAccountsWithStats),
    { initialValue: [] as IAccountWithStats[] },
  );

  public readonly total = computed(() => {
    let sum = 0;
    for (const a of this.accountsWithStats()) sum += a.totalValueBaseCurrency;
    return sum;
  });

  public readonly rows = computed<IRow[]>(() => {
    const now = Date.now();
    const total = this.total();
    return [...this.accountsWithStats()]
      .sort((a, b) => b.totalValueBaseCurrency - a.totalValueBaseCurrency)
      .map((a) => ({
        accountId: a.id,
        name: accountDisplayName(a),
        value: a.totalValueBaseCurrency,
        share: total > 0 ? a.totalValueBaseCurrency / total : 0,
        holdingCount: a.holdingCount,
        sync: syncDisplayFor(a, now),
      }));
  });

  public readonly hasAny = computed(() => this.rows().length > 0);

  public barWidthPct(row: IRow): number {
    return Math.max(2, Math.round(row.share * 100));
  }

  public formatMoney(n: number): string {
    return `$${Math.round(n).toLocaleString('en-US')}`;
  }

  public formatPct(share: number): string {
    const pct = share * 100;
    return pct >= 1 ? `${Math.round(pct)}%` : '<1%';
  }
}
