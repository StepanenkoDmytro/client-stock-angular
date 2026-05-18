import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AssetClass } from '../../../../../domain/asset-class.domain';
import {
  IHoldingLockMeta,
  IHoldingView,
} from '../../../../../domain/holding.domain';
import {
  ACCOUNT_KIND_FLAGS,
  AccountKindFlag,
  accountKindOf,
} from '../../../const/account-kind.const';
import { HoldingActionsService } from '../../../service/holding-actions.service';

/**
 * One per-Account row inside an expanded `pgz-position-card`.
 *
 * Reference: design/savings/02-position-card-btc.svg (right frame, lines
 * inside the BTC card breakdown).
 *
 * Layout (~48h):
 *   Row 1: [icon 16] account-name [chip?] [value $]
 *   Row 2:           quantity unit · lockMeta meta
 *
 * Drives per-row icon/chip from `ACCOUNT_KIND_FLAGS[holding.accountKind]`;
 * lock countdown from `holding.lockMeta`; "stored {duration}" for cold
 * wallets with `openedAt`. Pure presentation — no store reads, no service
 * deps; the parent Position-card supplies the precomputed `value`.
 */
@Component({
  selector: 'pgz-position-row',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatMenuModule],
  templateUrl: './position-row.component.html',
  styleUrl: './position-row.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PositionRowComponent {
  private readonly actions = inject(HoldingActionsService);

  // ---- Inputs ----

  @Input({ required: true })
  public set holding(value: IHoldingView) {
    this._holding.set(value);
  }
  public get holding(): IHoldingView {
    return this._holding();
  }
  private readonly _holding = signal<IHoldingView>({} as IHoldingView);

  /**
   * Current value in user's base currency (quantity × current price),
   * pre-computed by parent `pgz-position-card`. We don't recompute it
   * here to keep the row pure and avoid double price lookups when many
   * rows render at once.
   */
  @Input({ required: true })
  public set value(v: number) {
    this._value.set(v);
  }
  public get value(): number {
    return this._value();
  }
  private readonly _value = signal<number>(0);

  // ---- Derived ----

  /** Account-kind flag (icon / label / colour) for the leading glyph. */
  public readonly flag = computed<AccountKindFlag>(() => {
    return ACCOUNT_KIND_FLAGS[accountKindOf(this._holding())];
  });

  /** Account name with sensible fallback when seeded data lacks one. */
  public readonly accountLabel = computed<string>(() => {
    return this._holding().accountName ?? 'Manual';
  });

  /**
   * Optional "chip" content for row 1 — currently the APY for STAKING /
   * FLEXIBLE / TERM_DEPOSIT lockMeta variants. Returns null when nothing
   * to display.
   */
  public readonly chipLabel = computed<string | null>(() => {
    const meta = this._holding().lockMeta;
    if (!meta) {
      return null;
    }
    const apr = aprOf(meta);
    return apr !== null ? `~${formatApr(apr)}% APY` : null;
  });

  /**
   * Row 2 meta: "quantity unit" plus optional lock countdown or
   * cold-storage duration. Composed as a single string with " · "
   * separators so the template renders one span.
   */
  public readonly metaLine = computed<string>(() => {
    const h = this._holding();
    const parts: string[] = [this.quantityLabel(h)];

    const meta = h.lockMeta;
    if (meta) {
      const lockLine = lockMetaLine(meta);
      if (lockLine) {
        parts.push(lockLine);
      }
    } else if (
      h.accountKind === 'WALLET_COLD' &&
      h.openedAt
    ) {
      const dur = durationSince(h.openedAt);
      if (dur) {
        parts.push(`stored ${dur}`);
      }
    }

    return parts.join(' · ');
  });

  // ---- Actions (overflow menu) ----

  public onEdit(): void {
    this.actions.editHolding(this._holding().id);
  }

  public onDelete(): void {
    this.actions.deleteHolding(this._holding(), this._value());
  }

  // ---- Display helpers ----

  public formatNumber(value: number, fractionDigits = 0): string {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
  }

  /** "0.12 BTC" / "12 sh" / "$5,000" depending on AssetClass. */
  private quantityLabel(h: IHoldingView): string {
    const inst = h.instrument;
    switch (inst.assetClass) {
      case AssetClass.STOCK:
      case AssetClass.TOKENIZED_STOCK:
        return `${formatShares(h.quantity)} sh`;
      case AssetClass.CRYPTO:
        return `${formatCrypto(h.quantity)} ${inst.symbol}`;
      case AssetClass.CASH:
        return `$${formatShares(h.quantity)}`;
      case AssetClass.DEPOSIT:
        return `$${formatShares(h.quantity)}`;
      case AssetClass.REAL_ESTATE:
        return h.quantity === 1
          ? '1 unit'
          : `${formatShares(h.quantity)} units`;
      case AssetClass.OTHER:
        return formatShares(h.quantity);
    }
  }
}

// ---- Pure helpers — module-scope so they don't allocate per row ----

function aprOf(meta: IHoldingLockMeta): number | null {
  switch (meta.kind) {
    case 'STAKING':
    case 'FLEXIBLE':
      return meta.apr;
    case 'TERM_DEPOSIT':
      return meta.apr ?? null;
  }
}

function formatApr(apr: number): string {
  return apr.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
}

function lockMetaLine(meta: IHoldingLockMeta): string | null {
  switch (meta.kind) {
    case 'STAKING': {
      if (!meta.lockEndDate) {
        return null;
      }
      const days = daysUntil(meta.lockEndDate);
      const period = meta.lockPeriod ?? 'lock';
      if (days === null) {
        return period;
      }
      return days <= 0
        ? `${period} · ready`
        : `${period} · ${days} day${days === 1 ? '' : 's'} left`;
    }
    case 'TERM_DEPOSIT': {
      const date = new Date(meta.maturityDate);
      if (Number.isNaN(date.getTime())) {
        return null;
      }
      return `Locked until ${date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}`;
    }
    case 'FLEXIBLE':
      return null; // APR chip on row 1 is enough — nothing extra on row 2.
  }
}

function daysUntil(iso: string): number | null {
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) {
    return null;
  }
  const now = new Date();
  return Math.ceil(
    (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
}

function durationSince(iso: string): string | null {
  const start = new Date(iso);
  if (Number.isNaN(start.getTime())) {
    return null;
  }
  const now = new Date();
  const months = Math.max(
    0,
    (now.getFullYear() - start.getFullYear()) * 12 +
      (now.getMonth() - start.getMonth()),
  );
  if (months < 1) {
    return null;
  }
  if (months < 12) {
    return `${months}m`;
  }
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years}y ${rem}m` : `${years}y`;
}

function formatShares(qty: number): string {
  if (Number.isInteger(qty)) {
    return qty.toLocaleString('en-US');
  }
  return qty.toLocaleString('en-US', { maximumFractionDigits: 4 });
}

function formatCrypto(qty: number): string {
  return qty.toLocaleString('en-US', { maximumFractionDigits: 8 });
}
