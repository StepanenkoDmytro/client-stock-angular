import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  ILoopPosition,
  LoopRiskTone,
} from '../../../../../domain/loop-position.domain';
import { CurrencySymbolPipe } from '../../../../../pipe/currency-symbol.pipe';
import { FxRateService } from '../../../../../service/fx-rate.service';
import {
  LoopRiskRow,
  LoopRiskSummary,
  computeLoopRiskSummary,
  loopPostureLabel,
} from '../../../model/loop-risk.helper';

/**
 * Strategies-risk SUMMARY card (mockup `design/savings/18`, LP12). Replaces
 * the per-loop gauge-card stack in Statistics · Risk with ONE portfolio-wide
 * card: posture (weakest health, never an average), the aggregate
 * force-liquidation downside, blended leverage / weighted APY / worst buffer /
 * total borrowed, a weakest-first ranked list (tap → per-loop detail), and a
 * by-protocol counterparty split. Read-only, anonymous-safe.
 *
 * Drill-in: tapping a row opens the loop's detail (`/savings/loop/:id`,
 * `loop-detail` B-card). The old per-loop risk gauge C-card was removed as
 * dead code once this summary replaced the stack (LP14 #24, option B).
 */
@Component({
  selector: 'pgz-loop-risk-summary',
  standalone: true,
  imports: [CommonModule, CurrencySymbolPipe],
  templateUrl: './loop-risk-summary.component.html',
  styleUrl: './loop-risk-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoopRiskSummaryComponent implements OnChanges {
  private readonly fxRate = inject(FxRateService);
  private readonly router = inject(Router);

  @Input({ required: true }) loops: ILoopPosition[] = [];
  @Input() currency = 'USD';

  /** Recomputed in ngOnChanges (memoized per input change — not per CD). */
  summary: LoopRiskSummary = computeLoopRiskSummary([], () => 0);

  ngOnChanges(): void {
    this.summary = computeLoopRiskSummary(
      this.loops,
      (amount, cur) => this.fxRate.toBase(amount, cur, this.currency),
      new Date(),
    );
  }

  get postureLabel(): string {
    return loopPostureLabel(this.summary.postureTone);
  }

  /** Weakest loop (top of the ranked list) — drives the LOWEST HEALTH KPI. */
  get weakest(): LoopRiskRow | undefined {
    return this.summary.rows[0];
  }

  /** Drill-in: open the per-loop detail (savings/12 C lives there). */
  openLoop(row: LoopRiskRow): void {
    if (row.id == null) return;
    this.router.navigate(['/savings/loop', row.id]);
  }

  /** Tone → semantic colour class (`pos` / `warn` / `neg`). */
  toneClass(tone: LoopRiskTone): 'pos' | 'warn' | 'neg' {
    if (tone === 'green') return 'pos';
    if (tone === 'amber') return 'warn';
    return 'neg'; // red + liquidated
  }

  /**
   * Indigo shade per by-protocol segment — lighter as the index grows, mixed
   * toward the card background. Token-derived (no inline hex), matching the
   * strategy-loop family used across savings/12–18.
   */
  protocolShade(index: number): string {
    if (index === 0) return 'var(--strategy-loop)';
    const mix = Math.max(35, 80 - index * 22);
    return `color-mix(in srgb, var(--strategy-loop) ${mix}%, var(--pgz-card-bg))`;
  }

  formatHf(hf: number): string {
    return Number.isFinite(hf) ? hf.toFixed(2) : '∞';
  }

  // ---- formatting (same conventions as risk-section) ----

  abs(n: number): number {
    return Math.abs(n);
  }

  formatNumber(value: number, fractionDigits = 0): string {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
  }

  /** `41k` / `204k` / `950` — compact, no symbol. */
  formatCompact(value: number): string {
    const abs = Math.abs(value);
    if (abs >= 1000) {
      const k = abs / 1000;
      return `${k.toLocaleString('en-US', { maximumFractionDigits: 1 })}k`;
    }
    return Math.round(abs).toLocaleString('en-US');
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

  /** Whole-percent share for the by-protocol legend. */
  formatShare(share: number): string {
    const pct = share * 100;
    return pct >= 1 ? `${Math.round(pct)}%` : '<1%';
  }
}
