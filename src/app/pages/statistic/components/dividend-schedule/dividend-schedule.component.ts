import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

/**
 * Dividend schedule detail screen (mockup §10). Reached from the
 * Performance section's "Dividends · YTD ›" card on /statistic.
 * Hardcoded demo per mockup — bar chart + monthly event list. Year
 * tabs are visual-only in this PR; once /api/v1/dividends/schedule
 * ships, the active year drives a real signal.
 *
 * Route: /statistic/dividend-schedule
 */
type ExpandableMonth = 'feb' | 'may' | 'aug' | 'nov' | 'dec';

@Component({
  selector: 'pgz-dividend-schedule',
  standalone: true,
  templateUrl: './dividend-schedule.component.html',
  styleUrl: './dividend-schedule.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DividendScheduleComponent {
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  /** Feb expanded by default per mockup (first month with events). */
  protected readonly expanded = signal<ExpandableMonth | null>('feb');

  protected readonly years: ReadonlyArray<number> = [2024, 2025, 2026, 2027, 2028];
  protected readonly activeYear = signal<number>(2026);

  protected back(): void {
    // Prefer history back so the user lands on /statistic with the
    // page state preserved (active anchor, scroll position). Falls
    // back to a router push for direct-link entry into this screen.
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/statistic']);
    }
  }

  protected setYear(year: number): void {
    this.activeYear.set(year);
  }

  protected toggle(month: ExpandableMonth): void {
    this.expanded.update((cur) => (cur === month ? null : month));
  }

  protected isExpanded(month: ExpandableMonth): boolean {
    return this.expanded() === month;
  }
}
