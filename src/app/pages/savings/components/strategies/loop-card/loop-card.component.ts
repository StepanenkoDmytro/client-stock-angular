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
  loopLiquidationPayout,
  loopLtv,
  loopNetApy,
  loopNetPnlPercent,
  loopRiskTone,
} from '../../../../../domain/loop-position.domain';
import { CurrencySymbolPipe } from '../../../../../pipe/currency-symbol.pipe';
import { FxRateService } from '../../../../../service/fx-rate.service';

/**
 * Presentational B-style loop card (mockup savings/14 right frame · 12 B):
 * Net APY hero + Net value / Leverage / Health / LTV grid + two-leg strip +
 * exit-vs-liquidation. Pure: derives every figure from `@Input() loop` via
 * the `loop-position.domain` helpers — no service / route coupling, so it's
 * reused by the Holdings loop detail (routed) AND the Add-loop live preview
 * (mockup savings/17). Read-only.
 */
@Component({
  selector: 'pgz-loop-card',
  standalone: true,
  imports: [CommonModule, CurrencySymbolPipe],
  templateUrl: './loop-card.component.html',
  styleUrl: './loop-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoopCardComponent {
  private readonly fxRate = inject(FxRateService);

  @Input({ required: true }) loop!: ILoopPosition;
  /** Display (base) currency the money fields are FX-normalised into. */
  @Input() currency = 'USD';

  get name(): string {
    return loopDisplayName(this.loop);
  }

  /** "Aave v3 · eMode · Ethereum". */
  get subtitle(): string {
    const parts = [this.loop.protocol].filter((p) => !!p);
    if (this.loop.eMode) parts.push('eMode');
    if (this.loop.chain) parts.push(this.loop.chain);
    return parts.join(' · ');
  }

  private toBase(amount: number): number {
    return this.fxRate.toBase(amount, this.loop.currency, this.currency);
  }

  get equityNow(): number {
    return this.toBase(loopEquityNow(this.loop, new Date()));
  }

  get netApy(): number {
    return loopNetApy(this.loop);
  }

  get netPnlPercent(): number {
    return loopNetPnlPercent(this.loop, new Date());
  }

  get leverage(): number {
    return loopLeverage(this.loop);
  }

  get ltvPercent(): number {
    return loopLtv(this.loop) * 100;
  }

  get liqThreshold(): number {
    return this.loop.liquidationThreshold ?? 0;
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

  /**
   * `true` when HF < 1 — the loop is already force-closed (looping.md §6).
   * Drives the "closed + realized loss" layout instead of the live one.
   */
  get isLiquidated(): boolean {
    return this.tone === 'liquidated';
  }

  /** Residual recovered after a forced close (= liquidation payout). */
  get recovered(): number {
    return this.liquidationPayout;
  }

  private get capitalBase(): number {
    return this.toBase(this.loop.initialCapital ?? 0);
  }

  /** Realized loss after liquidation: recovered − capital (negative). */
  get realizedLoss(): number {
    return this.recovered - this.capitalBase;
  }

  get realizedLossPercent(): number {
    const cap = this.capitalBase;
    return cap > 0 ? (this.realizedLoss / cap) * 100 : 0;
  }

  abs(n: number): number {
    return Math.abs(n);
  }

  get toneLabel(): string {
    switch (this.tone) {
      case 'green':
        return 'safe';
      case 'amber':
        return 'watch';
      case 'red':
        return 'at risk';
      case 'liquidated':
        return 'liquidated';
    }
  }

  get collateralAmount(): number {
    return this.toBase(this.loop.totalCollateral ?? 0);
  }

  get debtAmount(): number {
    return this.toBase(this.loop.totalDebt ?? 0);
  }

  get collateralAsset(): string {
    return this.loop.collateralAsset || 'collateral';
  }

  get debtAsset(): string {
    return this.loop.debtAsset || 'debt';
  }

  /**
   * Voluntary exit ≈ current equity NOW (collateral − debt + accrued) — what
   * you'd walk away with if you closed the loop yourself. Must match the
   * card's NET VALUE / equity figure (looping.md §6), so it uses
   * `loopEquityNow`, not the pre-accrual snapshot.
   */
  get exitValue(): number {
    return this.equityNow;
  }

  /** Forced-liquidation residual — a crumb vs the voluntary exit. */
  get liquidationPayout(): number {
    return this.toBase(loopLiquidationPayout(this.loop));
  }

  // ---- formatting ----

  formatNumber(value: number, fractionDigits = 0): string {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
  }

  /** Compact "$30k" / "$1.2k" for the two-leg strip. */
  formatCompact(value: number): string {
    const abs = Math.abs(value);
    if (abs >= 1000) {
      const k = value / 1000;
      const digits = Math.abs(k) >= 100 || k % 1 === 0 ? 0 : 1;
      return `${k.toFixed(digits)}k`;
    }
    return this.formatNumber(value);
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
