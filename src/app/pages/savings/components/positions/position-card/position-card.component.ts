import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  computed,
  signal,
} from '@angular/core';
import { AssetClass } from '../../../../../domain/asset-class.domain';
import { IPosition } from '../../../../../domain/position.domain';
import { ITag } from '../../../../../domain/tag.domain';
import {
  isCryptoMetadata,
  isDepositMetadata,
  isRealEstateMetadata,
} from '../../../model/InstrumentMetadata';
import { PositionRowComponent } from '../position-row/position-row.component';

/**
 * Aggregate card for one Instrument's holdings — a "Position" in
 * ADR-0001 terms.
 *
 * Reference: design/savings/02-position-card-btc.svg.
 *
 * Two states:
 *   - **Collapsed** (default). Row 1: symbol + tag-dots + totalValue.
 *     Row 2: subline — single-holding cards show the per-class subline
 *     (same shape as `pgz-holding-card`); multi-holding cards show
 *     "{name} · {totalQty} {unit} across {N} locations".
 *   - **Expanded** (only when `holdings.length > 1`). Adds a dashed
 *     divider + one `pgz-position-row` per holding, sorted by holding
 *     value desc.
 *
 * Single-holding positions never show a chevron and don't react to
 * clicks — there is nothing to expand. Multi-holding positions toggle
 * expanded state on header click and on chevron click.
 *
 * Surface variants mirror `pgz-holding-card`: `card` (white, full
 * border) used when the card stands alone; `subcard` (sub-bg, no
 * shadow) used inside a class accordion panel.
 */
@Component({
  selector: 'pgz-position-card',
  standalone: true,
  imports: [CommonModule, PositionRowComponent],
  templateUrl: './position-card.component.html',
  styleUrl: './position-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PositionCardComponent {
  private static readonly MAX_TAG_DOTS = 4;

  // ---- Inputs ----

  @Input({ required: true })
  public set position(value: IPosition) {
    this._position.set(value);
  }
  public get position(): IPosition {
    return this._position();
  }
  private readonly _position = signal<IPosition>({} as IPosition);

  @Input() public variant: 'card' | 'subcard' = 'card';

  // ---- Local state ----

  private readonly _expanded = signal(false);
  public readonly expanded = this._expanded.asReadonly();

  // ---- Derived ----

  public readonly isMulti = computed<boolean>(() => {
    return (this._position().holdings ?? []).length > 1;
  });

  public readonly tagDots = computed<ITag[]>(() => {
    const tags = this._position().tags ?? [];
    return tags.slice(0, PositionCardComponent.MAX_TAG_DOTS);
  });

  /**
   * The single-line description under the symbol row.
   *
   * Multi-holding: prefix with instrument name, suffix with the total
   * quantity in the canonical unit + "across N locations".
   * Single-holding: defer to the per-class subline below.
   */
  public readonly subline = computed<string>(() => {
    const pos = this._position();
    if (!pos.instrument) {
      return '';
    }
    if ((pos.holdings ?? []).length > 1) {
      const unit = unitFor(pos.instrument.assetClass, pos.instrument.symbol);
      const qty = formatQuantity(
        pos.totalQuantity,
        pos.instrument.assetClass,
      );
      const count = pos.holdings.length;
      return `${pos.instrument.name} · ${qty} ${unit} across ${count} locations`;
    }
    return singleHoldingSubline(pos);
  });

  // ---- Actions ----

  public toggle(): void {
    if (this.isMulti()) {
      this._expanded.update((v) => !v);
    }
  }

  // ---- Display helpers (template) ----

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

  public abs(n: number): number {
    return Math.abs(n);
  }
}

// ---- Pure helpers — module scope ----

function unitFor(cls: AssetClass, symbol: string): string {
  switch (cls) {
    case AssetClass.STOCK:
    case AssetClass.TOKENIZED_STOCK:
      return 'sh';
    case AssetClass.CRYPTO:
      return symbol;
    case AssetClass.CASH:
      return symbol;
    case AssetClass.DEPOSIT:
      return symbol;
    case AssetClass.REAL_ESTATE:
      return 'units';
    case AssetClass.OTHER:
      return 'units';
  }
}

function formatQuantity(qty: number, cls: AssetClass): string {
  if (cls === AssetClass.CRYPTO) {
    return qty.toLocaleString('en-US', { maximumFractionDigits: 8 });
  }
  if (Number.isInteger(qty)) {
    return qty.toLocaleString('en-US');
  }
  return qty.toLocaleString('en-US', { maximumFractionDigits: 4 });
}

/**
 * Per-class one-liner for a single-holding Position. Same shape as
 * `HoldingCardComponent.subline` so the two cards read consistently
 * when the user mixes views. We can't share the code yet — the
 * holding-card pulls live price from HoldingService inline, which we
 * don't want in PositionCard (the parent already gave us the value).
 */
function singleHoldingSubline(pos: IPosition): string {
  const inst = pos.instrument;
  const meta = inst.metadata;
  switch (inst.assetClass) {
    case AssetClass.STOCK:
    case AssetClass.TOKENIZED_STOCK:
      return `${inst.name} · ${formatQuantity(pos.totalQuantity, inst.assetClass)} sh`;
    case AssetClass.CRYPTO:
      if (isCryptoMetadata(meta)) {
        const avg =
          pos.totalQuantity > 0 ? pos.totalValue / pos.totalQuantity : 0;
        const avgLabel = avg.toLocaleString('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        });
        return `${formatQuantity(pos.totalQuantity, inst.assetClass)} ${inst.symbol} × $${avgLabel}`;
      }
      return inst.name;
    case AssetClass.CASH:
      return inst.name;
    case AssetClass.DEPOSIT:
      if (isDepositMetadata(meta)) {
        const rate = meta.interestRate.toLocaleString('en-US', {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        });
        return `${inst.name} · ${rate}% APY`;
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
}
