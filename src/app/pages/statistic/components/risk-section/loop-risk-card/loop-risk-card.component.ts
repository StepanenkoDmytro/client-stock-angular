import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  inject,
} from '@angular/core';
import {
  ILoopPosition,
  LoopRiskTone,
  loopDisplayName,
  loopEquityNow,
  loopHealthFactor,
  loopLeverage,
  loopLiquidationBuffer,
  loopLiquidationPayout,
  loopLtv,
  loopNetApy,
  loopNetPnl,
  loopRiskTone,
} from '../../../../../domain/loop-position.domain';
import { CurrencySymbolPipe } from '../../../../../pipe/currency-symbol.pipe';
import { FxRateService } from '../../../../../service/fx-rate.service';

/**
 * Loop risk C-card — the risk-gauge hero (mockup savings/12 C). Liquidation
 * safety leads (a loop can be force-closed), yield is secondary. Shows the
 * health-factor gauge, LTV vs liquidation threshold, the collateral-drop
 * buffer and the exit-vs-liquidation contrast — the core "is my loop
 * healthy?" answer. Lives in Statistics → Risk (read-only).
 */
@Component({
  selector: 'pgz-loop-risk-card',
  standalone: true,
  imports: [CommonModule, CurrencySymbolPipe],
  templateUrl: './loop-risk-card.component.html',
  styleUrl: './loop-risk-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoopRiskCardComponent {
  private readonly fxRate = inject(FxRateService);

  /** HF gauge spans 1.0..3.0 with zone breaks at 1.3 (red→amber) / 1.8 (→green). */
  private static readonly GAUGE_MIN = 1.0;
  private static readonly GAUGE_MAX = 3.0;

  @Input({ required: true }) loop!: ILoopPosition;
  @Input() currency = 'USD';

  get name(): string {
    return loopDisplayName(this.loop);
  }

  get subtitle(): string {
    const parts = [this.loop.protocol];
    if (this.loop.eMode) parts.push('eMode');
    if (this.loop.chain) parts.push(this.loop.chain);
    return parts.join(' · ');
  }

  private toBase(amount: number): number {
    return this.fxRate.toBase(amount, this.loop.currency, this.currency);
  }

  get healthFactor(): number {
    return loopHealthFactor(this.loop);
  }

  get healthLabel(): string {
    const hf = this.healthFactor;
    return Number.isFinite(hf) ? hf.toFixed(2) : '∞';
  }

  get tone(): LoopRiskTone {
    return loopRiskTone(this.healthFactor);
  }

  /** HF < 1 → already force-closed (looping.md §6). */
  get isLiquidated(): boolean {
    return this.tone === 'liquidated';
  }

  /** Residual recovered after a forced close (= liquidation payout). */
  get recovered(): number {
    return this.liquidationPayout;
  }

  /** Realized loss after liquidation: recovered − capital (negative). */
  get realizedLoss(): number {
    return this.recovered - this.toBase(this.loop.initialCapital ?? 0);
  }

  get realizedLossPercent(): number {
    const cap = this.toBase(this.loop.initialCapital ?? 0);
    return cap > 0 ? (this.realizedLoss / cap) * 100 : 0;
  }

  /** Marker position along the 1.0..3.0 gauge as a 0..100 percent. */
  get gaugeMarkerPct(): number {
    const hf = this.healthFactor;
    if (!Number.isFinite(hf)) return 100;
    const { GAUGE_MIN, GAUGE_MAX } = LoopRiskCardComponent;
    const frac = (hf - GAUGE_MIN) / (GAUGE_MAX - GAUGE_MIN);
    return Math.min(100, Math.max(0, frac * 100));
  }

  get ltvPercent(): number {
    return loopLtv(this.loop) * 100;
  }

  get liqThreshold(): number {
    return this.loop.liquidationThreshold ?? 0;
  }

  /** Collateral-drop buffer to HF=1, as a positive percent (display "−X%"). */
  get bufferPercent(): number {
    return loopLiquidationBuffer(this.loop) * 100;
  }

  get collateralAsset(): string {
    return this.loop.collateralAsset;
  }

  get debtAsset(): string {
    return this.loop.debtAsset;
  }

  get equityNow(): number {
    return this.toBase(loopEquityNow(this.loop, new Date()));
  }

  get netApy(): number {
    return loopNetApy(this.loop);
  }

  get netPnl(): number {
    return this.toBase(loopNetPnl(this.loop, new Date()));
  }

  /**
   * Voluntary exit ≈ current equity NOW (incl. accrued) — must match the
   * card's EQUITY figure (looping.md §6), so it uses `loopEquityNow`.
   */
  get exitValue(): number {
    return this.equityNow;
  }

  get liquidationPayout(): number {
    return this.toBase(loopLiquidationPayout(this.loop));
  }

  get leverage(): number {
    return loopLeverage(this.loop);
  }

  // ---- formatting ----

  abs(n: number): number {
    return Math.abs(n);
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
