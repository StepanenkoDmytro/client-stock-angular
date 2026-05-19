import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AccountCountChipsComponent } from './widgets/account-count-chips/account-count-chips.component';
import { PerAccountBreakdownComponent } from './widgets/per-account-breakdown/per-account-breakdown.component';
import { PerClassAccountBreakdownComponent } from './widgets/per-class-account-breakdown/per-class-account-breakdown.component';
import { CounterpartyRiskComponent } from './widgets/counterparty-risk/counterparty-risk.component';
import { SpofWarningComponent } from './widgets/spof-warning/spof-warning.component';
import { JurisdictionConcentrationComponent } from './widgets/jurisdiction-concentration/jurisdiction-concentration.component';

/**
 * Container for the portfolio analytics widgets on `/statistic`. Layout
 * order intentional: structural distribution first (Task 1 widgets W1-W3),
 * then risk surfaces (Task 2 — SPOF, counterparty), then jurisdiction
 * (Task 3, pending). One `<section class="ps">` block so the page reads
 * as one coherent "Portfolio" panel rather than a stack of one-offs.
 */
@Component({
  selector: 'pgz-portfolio-stats',
  standalone: true,
  imports: [
    AccountCountChipsComponent,
    PerAccountBreakdownComponent,
    PerClassAccountBreakdownComponent,
    SpofWarningComponent,
    CounterpartyRiskComponent,
    JurisdictionConcentrationComponent,
  ],
  templateUrl: './portfolio-stats.component.html',
  styleUrl: './portfolio-stats.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioStatsComponent {}
