import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AccountCountChipsComponent } from './widgets/account-count-chips/account-count-chips.component';
import { PerAccountBreakdownComponent } from './widgets/per-account-breakdown/per-account-breakdown.component';
import { PerClassAccountBreakdownComponent } from './widgets/per-class-account-breakdown/per-class-account-breakdown.component';

/**
 * Container for the portfolio analytics widgets on `/statistic`. The
 * first three widgets ship with Stats Task 1 (`docs/notes/2026-05-stats-1-account-breakdowns.md`);
 * Task 2 will append risk widgets and Task 3 a jurisdiction widget into
 * the same `<section class="ps">` block so the rendered page stays one
 * coherent "Portfolio" panel rather than a stack of one-offs.
 */
@Component({
  selector: 'pgz-portfolio-stats',
  standalone: true,
  imports: [
    AccountCountChipsComponent,
    PerAccountBreakdownComponent,
    PerClassAccountBreakdownComponent,
  ],
  templateUrl: './portfolio-stats.component.html',
  styleUrl: './portfolio-stats.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioStatsComponent {}
