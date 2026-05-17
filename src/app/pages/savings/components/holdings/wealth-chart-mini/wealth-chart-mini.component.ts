import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Wealth-over-time mini chart — stub for MVP.
 *
 * Reference: design/savings/01-portfolio-dashboard-mobile.svg lines 103-131
 * (full implementation later) and design/analytics/01-net-wealth-chart.svg
 * (full-screen version).
 *
 * For MVP renders the card slot with a helper message — real chart appears
 * when CashFlow journal lands (M5.5 / ADR-0008), since the chart needs the
 * historical invested-vs-value curve over time, which we can't reconstruct
 * without deposit timestamps.
 *
 * Reserving the layout slot now keeps the page geometry stable when the
 * real chart drops in.
 */
@Component({
  selector: 'pgz-wealth-chart-mini',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wealth-chart-mini.component.html',
  styleUrl: './wealth-chart-mini.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WealthChartMiniComponent {}
