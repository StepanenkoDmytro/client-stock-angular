import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  computed,
  inject,
  signal,
} from '@angular/core';
import { AssetClass } from '../../../../../domain/asset-class.domain';
import { IHoldingView } from '../../../../../domain/holding.domain';
import { ITag } from '../../../../../domain/tag.domain';
import {
  isCryptoMetadata,
  isDepositMetadata,
  isRealEstateMetadata,
} from '../../../model/InstrumentMetadata';
import { HoldingService } from '../../../service/holding.service';

/**
 * Single holding card.
 *
 * Reference: design/savings/01-portfolio-dashboard-mobile.svg lines 153-187.
 *
 * Layout (88h compact):
 *  - Row 1: Symbol + tag-dots (max 4) + current value (right).
 *  - Row 2: Per-class subline (e.g. "Apple Inc. · 24 sh", "0.45 BTC × $58,000").
 *  - Dashed divider.
 *  - Row 3: Lifetime PnL + period + income (stub).
 *
 * Two surface variants:
 *  - `card` (default) — white bg, full border, used in Holdings flat list.
 *  - `subcard` — sub-card bg (`--pgz-card-bg-sub`), no shadow, used
 *    inside class accordion panels in Classes view.
 */
@Component({
  selector: 'pgz-holding-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './holding-card.component.html',
  styleUrl: './holding-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HoldingCardComponent {
  private readonly holdings = inject(HoldingService);

  // ---- Inputs ----

  /** Backing data — required. */
  @Input({ required: true })
  public set holding(value: IHoldingView) {
    this._holding.set(value);
  }
  public get holding(): IHoldingView {
    return this._holding();
  }
  private readonly _holding = signal<IHoldingView | null>(null);

  /** Surface variant — affects bg/shadow. */
  @Input() public variant: 'card' | 'subcard' = 'card';

  // ---- Derived values ----

  private static readonly MAX_TAG_DOTS = 4;

  public readonly tagDots = computed<ITag[]>(() => {
    const h = this._holding();
    if (!h) {
      return [];
    }
    return h.tags.slice(0, HoldingCardComponent.MAX_TAG_DOTS);
  });

  public readonly currentValue = computed<number>(() => {
    const h = this._holding();
    if (!h) {
      return 0;
    }
    const price =
      this.holdings.getCurrentPrice(h.instrument.symbol) ?? h.averageBuyPrice;
    return h.quantity * price;
  });

  public readonly costBasis = computed<number>(() => {
    const h = this._holding();
    return h ? h.quantity * h.averageBuyPrice : 0;
  });

  public readonly pnl = computed<number>(() => this.currentValue() - this.costBasis());

  public readonly pnlPercent = computed<number>(() => {
    const cb = this.costBasis();
    return cb > 0 ? (this.pnl() / cb) * 100 : 0;
  });

  /** Per-class subline that summarises the position in one line.
   *
   * In Holdings flat view the same Instrument can show up multiple times
   * (e.g. BTC on cold wallet + Bybit Earn + Bybit Spot). To keep those
   * rows visually distinct we append the account name as a final segment
   * whenever the holding lives on something other than the legacy
   * "MANUAL" bucket — for MANUAL holdings the suffix would be noise. */
  public readonly subline = computed<string>(() => {
    const h = this._holding();
    if (!h) {
      return '';
    }
    const inst = h.instrument;
    const meta = inst.metadata;

    const base = ((): string => {
      switch (inst.assetClass) {
        case AssetClass.STOCK:
        case AssetClass.TOKENIZED_STOCK:
          return `${inst.name} · ${this.formatShareCount(h.quantity)} sh`;

        case AssetClass.CRYPTO:
          if (isCryptoMetadata(meta)) {
            const px =
              this.holdings.getCurrentPrice(inst.symbol) ?? h.averageBuyPrice;
            return `${this.formatCryptoQty(h.quantity)} ${inst.symbol} × $${this.formatNumber(px)}`;
          }
          return inst.name;

        case AssetClass.CASH:
          return inst.name;

        case AssetClass.DEPOSIT:
          if (isDepositMetadata(meta)) {
            return `${inst.name} · ${this.formatPercent(meta.interestRate, 1)} APY`;
          }
          return inst.name;

        case AssetClass.REAL_ESTATE:
          if (isRealEstateMetadata(meta) && meta.country) {
            return `${inst.name} · ${meta.country}`;
          }
          return inst.name;

        case AssetClass.OTHER:
          return `${inst.name} · Manual entry`;
      }
    })();

    if (
      h.accountName &&
      h.accountKind &&
      h.accountKind !== 'MANUAL'
    ) {
      return `${base} · ${h.accountName}`;
    }
    return base;
  });

  /**
   * Holding age formatted as "Ny Mm" (e.g. "3y 4m") for the lifetime row.
   * For freshly seeded mock data returns "today".
   */
  public readonly periodLabel = computed<string>(() => {
    const h = this._holding();
    if (!h) {
      return '';
    }
    const created = new Date(h.createdAt);
    const now = new Date();
    const days = Math.floor(
      (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (days < 1) {
      return 'today';
    }
    if (days < 30) {
      return `${days}d`;
    }
    const months = Math.floor(days / 30);
    if (months < 12) {
      return `${months}m`;
    }
    const years = Math.floor(months / 12);
    const remMonths = months % 12;
    return remMonths > 0 ? `${years}y ${remMonths}m` : `${years}y`;
  });

  // ---- Display helpers ----

  public abs(n: number): number {
    return Math.abs(n);
  }

  public pnlSign(): string {
    return this.pnl() >= 0 ? '+' : '−';
  }

  public formatNumber(value: number, fractionDigits = 0): string {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
  }

  public formatPercent(value: number, fractionDigits = 1): string {
    return (
      value.toLocaleString('en-US', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      }) + '%'
    );
  }

  private formatShareCount(qty: number): string {
    // Stocks: integer if whole, up to 4 decimals otherwise.
    if (Number.isInteger(qty)) {
      return qty.toLocaleString('en-US');
    }
    return qty.toLocaleString('en-US', { maximumFractionDigits: 4 });
  }

  private formatCryptoQty(qty: number): string {
    // Crypto: up to 8 significant digits per ux-principles §7.
    return qty.toLocaleString('en-US', { maximumFractionDigits: 8 });
  }
}
