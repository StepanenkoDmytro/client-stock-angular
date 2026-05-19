import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import {
  AccountTypeV2,
  accountDisplayName,
} from '../../../../../domain/account-v2.domain';
import { selectAccountsList } from '../../../store/accounts.selectors';

/**
 * Compact account "chip" rendered inside holding cards: icon (per
 * {@link AccountTypeV2}) + display name. Resolves the account from the
 * accounts store by `accountId`; if the id is missing or the account no
 * longer exists, the component renders nothing — callers don't need to
 * guard the call site.
 *
 * <p>MVP behaviour: tap is a no-op (visual chip only). When account
 * detail navigation lands (likely via the existing PR-A6 AccountsSheet
 * with a `highlightAccountId` prop), the click handler hooks here.
 *
 * <p>Reuses the same emoji vocabulary as `AccountRowComponent.iconForType`
 * and `AccountCountChipsComponent` so the visual language stays
 * consistent across the bottom-sheet, /statistic widgets, and per-card
 * chips.
 */
@Component({
  selector: 'pgz-account-link-chip',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './account-link-chip.component.html',
  styleUrl: './account-link-chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountLinkChipComponent {
  private readonly store = inject(Store);

  /** Holding's accountId. Null/undefined → component renders nothing. */
  @Input()
  public set accountId(v: string | null | undefined) {
    this._accountId.set(v ?? null);
  }
  public get accountId(): string | null {
    return this._accountId();
  }
  private readonly _accountId = signal<string | null>(null);

  private readonly accounts = toSignal(this.store.select(selectAccountsList), {
    initialValue: [],
  });

  public readonly account = computed(() => {
    const id = this._accountId();
    if (!id) return null;
    return this.accounts().find((a) => a.id === id) ?? null;
  });

  public readonly icon = computed<string>(() => {
    const a = this.account();
    return a ? ICON[a.accountType] : '';
  });

  public readonly label = computed<string>(() => {
    const a = this.account();
    return a ? accountDisplayName(a) : '';
  });
}

const ICON: Record<AccountTypeV2, string> = {
  BROKERAGE: '📈',
  EXCHANGE: '⚡',
  WALLET: '❄',
  BANK: '🏦',
  MANUAL: '⌶',
};
