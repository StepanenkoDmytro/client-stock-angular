import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
} from '@angular/core';
import {
  ILoopPosition,
  LoopRiskTone,
  loopDisplayName,
  loopEquityNow,
  loopHealthFactor,
  loopLeverage,
  loopLiquidationPayout,
  loopNetApy,
  loopRiskTone,
} from '../../../../../domain/loop-position.domain';
import { CurrencySymbolPipe } from '../../../../../pipe/currency-symbol.pipe';
import { FxRateService } from '../../../../../service/fx-rate.service';

/**
 * Compact A-style loop row — the "Strategies" instrument card on the
 * dashboard (mockup savings/15 subcard · savings/14 band). Leads with the
 * loop's net equity (its net-worth share); shows a health dot + net APY at a
 * glance. Tapping opens the Holdings detail (B-card, LP6).
 *
 * Self-contained: derives all metrics from `ILoopPosition` via the
 * `loop-position.domain` pure helpers and FX-converts money into the display
 * currency. Read-only — no mutation here.
 */
@Component({
  selector: 'pgz-loop-row',
  standalone: true,
  imports: [CommonModule, CurrencySymbolPipe],
  templateUrl: './loop-row.component.html',
  styleUrl: './loop-row.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoopRowComponent {
  private readonly fxRate = inject(FxRateService);

  @Input({ required: true }) loop!: ILoopPosition;
  /** Display (base) currency the equity is FX-normalised into. */
  @Input() currency = 'USD';
  /** `subcard` (inside the accordion class) or `card` (standalone band). */
  @Input() variant: 'subcard' | 'card' = 'subcard';

  @Output() open = new EventEmitter<ILoopPosition>();

  get name(): string {
    return loopDisplayName(this.loop);
  }

  /** "Aave v3 · eMode · 3.0×" — protocol, optional eMode, leverage. */
  get subtitle(): string {
    const parts = [this.loop.protocol];
    if (this.loop.eMode) parts.push('eMode');
    parts.push(`${this.leverage.toFixed(1)}×`);
    return parts.join(' · ');
  }

  private toBase(amount: number): number {
    return this.fxRate.toBase(amount, this.loop.currency, this.currency);
  }

  get equityNow(): number {
    return this.toBase(loopEquityNow(this.loop, new Date()));
  }

  /** HF < 1 → already force-closed (looping.md §6). */
  get isLiquidated(): boolean {
    return this.tone === 'liquidated';
  }

  /** Headline value: live equity, or the recovered residual once liquidated. */
  get displayValue(): number {
    return this.isLiquidated
      ? this.toBase(loopLiquidationPayout(this.loop))
      : this.equityNow;
  }

  /** Realized loss % after liquidation (recovered vs capital). */
  get realizedLossPercent(): number {
    const cap = this.toBase(this.loop.initialCapital ?? 0);
    if (cap <= 0) return 0;
    return ((this.toBase(loopLiquidationPayout(this.loop)) - cap) / cap) * 100;
  }

  get netApy(): number {
    return loopNetApy(this.loop);
  }

  get leverage(): number {
    return loopLeverage(this.loop);
  }

  get healthFactor(): number {
    return loopHealthFactor(this.loop);
  }

  get tone(): LoopRiskTone {
    return loopRiskTone(this.healthFactor);
  }

  /** "1.42" or "∞" when the loop carries no debt. */
  get healthLabel(): string {
    const hf = this.healthFactor;
    return Number.isFinite(hf) ? hf.toFixed(2) : '∞';
  }

  onOpen(): void {
    this.open.emit(this.loop);
  }

  formatNumber(value: number, fractionDigits = 0): string {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
  }

  formatPercent(value: number, fractionDigits = 1): string {
    const sign = value >= 0 ? '+' : '−';
    return (
      sign +
      Math.abs(value).toLocaleString('en-US', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      }) +
      '%'
    );
  }
}
