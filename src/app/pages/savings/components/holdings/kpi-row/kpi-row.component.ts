import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

interface KpiSpec {
  caption: string;
  value: string;
  subtext: string;
}

/**
 * 2×2 KPI row of investor-focused metrics.
 *
 * Reference: design/savings/01-portfolio-dashboard-mobile.svg lines 81-101.
 *
 * MVP renders 4 stub cards with "—" values and an "Available after M5.5"
 * subtext (per portfolio-screen-plan §PR6). Real values land when CashFlow
 * journal arrives (ADR-0008 / roadmap M5.5):
 *
 *   - Income this year — sum of dividend payouts YTD.
 *   - Realized YTD — capital gains from closed positions YTD.
 *   - Forward yield — projected annual income / current portfolio value.
 *   - Top dividend source — symbol with largest lifetime payouts.
 *
 * For now we show the layout slot so the page geometry doesn't reflow
 * when these become real, and so users see what's coming.
 */
@Component({
  selector: 'pgz-kpi-row',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kpi-row.component.html',
  styleUrl: './kpi-row.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiRowComponent {
  public readonly kpis: ReadonlyArray<KpiSpec> = [
    {
      caption: 'INCOME 2026',
      value: '—',
      subtext: 'Available after M5.5',
    },
    {
      caption: 'REALIZED YTD',
      value: '—',
      subtext: 'Closed positions',
    },
    {
      caption: 'FORWARD YIELD',
      value: '—',
      subtext: 'Projected / 12 mo',
    },
    {
      caption: 'TOP DIV SOURCE',
      value: '—',
      subtext: 'Lifetime payouts',
    },
  ];
}
