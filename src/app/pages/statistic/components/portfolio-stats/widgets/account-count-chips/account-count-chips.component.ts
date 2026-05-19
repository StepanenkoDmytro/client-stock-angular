import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { AccountTypeV2 } from '../../../../../../domain/account-v2.domain';
import { selectAccountsList } from '../../../../../savings/store/accounts.selectors';

interface IChip {
  type: AccountTypeV2;
  label: string;
  icon: string;
  count: number;
}

/**
 * W1 — "YOUR PROVIDERS". Renders one chip per non-empty AccountTypeV2
 * bucket (BROKERAGE / EXCHANGE / WALLET / BANK / MANUAL). Source spec:
 * `docs/notes/2026-05-stats-1-account-breakdowns.md` §5 W1.
 *
 * <p>Buckets with count 0 are skipped — a user with only a brokerage
 * shouldn't see four greyed-out chips. Emojis duplicate the icons used
 * in {@code AccountRowComponent.iconForType} so the visual vocabulary
 * stays consistent between the bottom-sheet and the stats page.
 *
 * <p>MVP: tap is a no-op. The brainstorm calls for a tap to open
 * `AccountsSheet` filtered by type; the sheet needs a filter prop first
 * (deferred to Task 2/3 per spec §5 W1 acceptance).
 */
@Component({
  selector: 'pgz-account-count-chips',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './account-count-chips.component.html',
  styleUrl: './account-count-chips.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountCountChipsComponent {
  private readonly store = inject(Store);

  private readonly accounts = toSignal(this.store.select(selectAccountsList), {
    initialValue: [],
  });

  public readonly chips = computed<IChip[]>(() => {
    const counts = new Map<AccountTypeV2, number>();
    for (const a of this.accounts()) {
      counts.set(a.accountType, (counts.get(a.accountType) ?? 0) + 1);
    }
    const order: AccountTypeV2[] = ['BROKERAGE', 'EXCHANGE', 'WALLET', 'BANK', 'MANUAL'];
    const result: IChip[] = [];
    for (const t of order) {
      const c = counts.get(t) ?? 0;
      if (c === 0) continue;
      result.push({ type: t, label: LABEL[t], icon: ICON[t], count: c });
    }
    return result;
  });

  public readonly hasAny = computed(() => this.chips().length > 0);
}

const LABEL: Record<AccountTypeV2, string> = {
  BROKERAGE: 'Brokerage',
  EXCHANGE: 'Exchange',
  WALLET: 'Wallet',
  BANK: 'Bank',
  MANUAL: 'Manual',
};

const ICON: Record<AccountTypeV2, string> = {
  BROKERAGE: '📈',
  EXCHANGE: '⚡',
  WALLET: '❄',
  BANK: '🏦',
  MANUAL: '⌶',
};
