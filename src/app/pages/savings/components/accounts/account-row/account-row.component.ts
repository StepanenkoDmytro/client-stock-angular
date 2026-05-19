import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import {
  AccountTypeV2,
  IAccountV2,
  SyncStatus,
  accountDisplayName,
} from '../../../../../domain/account-v2.domain';
import { IAccountWithCount } from '../../../store/accounts.selectors';

/**
 * One row in `<pgz-accounts-sheet>`. Mirrors approved design
 * `06-accounts-header-entry.svg` F2: icon-in-circle + name +
 * "{TYPE} · {CURRENCY} · {N} holdings" subtitle + sync-status dot
 * + value (top-right) + ⋯ menu (bottom-right).
 *
 * <p>STALE/ERROR rows get an amber border to draw the eye.
 *
 * <p>Emits typed events (`edit` / `delete` / `retry`) instead of
 * holding service references — the sheet owns the orchestration.
 */
@Component({
  selector: 'pgz-account-row',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatMenuModule],
  templateUrl: './account-row.component.html',
  styleUrl: './account-row.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountRowComponent {
  @Input({ required: true })
  public set account(value: IAccountWithCount) {
    this._account.set(value);
  }
  public get account(): IAccountWithCount {
    return this._account()!;
  }
  private readonly _account = signal<IAccountWithCount | null>(null);

  @Output() public readonly edit = new EventEmitter<IAccountV2>();
  @Output() public readonly delete = new EventEmitter<IAccountV2>();
  @Output() public readonly retry = new EventEmitter<IAccountV2>();

  public readonly label = computed(() => {
    const a = this._account();
    return a ? accountDisplayName(a) : '';
  });

  public readonly subtitle = computed(() => {
    const a = this._account();
    if (!a) return '';
    const parts: string[] = [a.accountType];
    if (a.currency) parts.push(a.currency);
    parts.push(`${a.holdingCount} holding${a.holdingCount === 1 ? '' : 's'}`);
    return parts.join(' · ');
  });

  public readonly statusLine = computed<{ tone: 'ok' | 'warn' | 'manual' | 'never'; text: string }>(() => {
    const a = this._account();
    if (!a) return { tone: 'never', text: '' };
    const status: SyncStatus | undefined = a.syncStatus;
    const last = a.lastSyncedAt;

    if (a.accountType === 'MANUAL') {
      return {
        tone: 'manual',
        text: last ? `Manual · edited ${relativeFromNow(last)}` : 'Manual entry only',
      };
    }
    switch (status) {
      case 'OK':
        return { tone: 'ok', text: last ? `Synced ${relativeFromNow(last)}` : 'Synced' };
      case 'STALE':
      case 'ERROR':
        return {
          tone: 'warn',
          text: last
            ? `Sync failed · ${relativeFromNow(last)}`
            : 'Sync failed',
        };
      case 'NEVER':
      default:
        return { tone: 'never', text: 'Never synced' };
    }
  });

  /**
   * True when the row's status is amber (STALE / ERROR) — drives the
   * border treatment in the template.
   */
  public readonly isAttention = computed(() => this.statusLine().tone === 'warn');

  /**
   * Retry only makes sense for provider-backed accounts in a non-OK
   * state. MANUAL accounts get no Retry option (nothing to sync).
   */
  public readonly canRetry = computed(() => {
    const a = this._account();
    if (!a) return false;
    if (a.accountType === 'MANUAL') return false;
    return a.syncStatus === 'STALE' || a.syncStatus === 'ERROR' || a.syncStatus === 'NEVER';
  });

  /**
   * Emoji icon per account type — matches the SVG mockup's placeholder
   * glyphs. Production design will swap for SVG paths when the icon
   * design system lands; emoji is good enough for the 5-tester beta.
   */
  public readonly iconForType = computed(() => iconForType(this._account()?.accountType));

  /** Background tint of the icon circle, per type. */
  public readonly iconBgForType = computed(() => iconBgForType(this._account()?.accountType));

  public onEdit(): void {
    const a = this._account();
    if (a) this.edit.emit(a);
  }

  public onDelete(): void {
    const a = this._account();
    if (a) this.delete.emit(a);
  }

  public onRetry(): void {
    const a = this._account();
    if (a) this.retry.emit(a);
  }
}

/**
 * "2h ago" / "3d ago" / "just now". Pure-ish — uses `Date.now()` once
 * per call, fine for component rendering. Used in row status text.
 */
function relativeFromNow(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return 'unknown';
  const diffSec = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}min ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d ago`;
}

function iconForType(t: AccountTypeV2 | undefined): string {
  switch (t) {
    case 'BROKERAGE': return '📈';
    case 'EXCHANGE':  return '⚡';
    case 'BANK':      return '🏦';
    case 'WALLET':    return '❄';
    case 'MANUAL':
    default:          return '⌶';
  }
}

function iconBgForType(t: AccountTypeV2 | undefined): string {
  // Tints picked from the SVG mockup to match each row visually.
  switch (t) {
    case 'BROKERAGE': return '#DCE7F4';
    case 'EXCHANGE':  return '#EEEDFE';
    case 'BANK':      return '#FAEEDA';
    case 'WALLET':    return '#F1EFE8';
    case 'MANUAL':
    default:          return '#F1EFE8';
  }
}
