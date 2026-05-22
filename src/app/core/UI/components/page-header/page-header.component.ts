import { CommonModule, Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Standard page header for top-level + sub-page surfaces (M5.6 PR2).
 *
 * <p>Replaces the legacy {@code <pgz-prev-route>} blue-gradient banner
 * with the modern card-style: transparent background that inherits the
 * page bg, dark text, mat-icon-button back arrow, optional right slot
 * for context-specific actions (chip, button, anything projected via
 * {@code <ng-content select="[action]">}).
 *
 * <p>Three usage patterns:
 * <ul>
 *   <li><b>Top-level pages</b> (savings, spending, statistic, profile):
 *       {@code <pgz-page-header title="Portfolio"><pgz-accounts-chip action /></pgz-page-header>}.
 *       No back button by default — bottom nav is the navigation surface.</li>
 *   <li><b>Sub-pages</b> (holdings, accounts, tags): pass
 *       {@code [showBack]="true"} — emits {@link #back} which the parent
 *       handles via Router/Location. If parent doesn't bind the event,
 *       falls back to {@code Location.back()} internally.</li>
 *   <li><b>Custom action</b>: pass any content in the action slot —
 *       chip, link, mat-button, icon-button. Component doesn't care.</li>
 * </ul>
 *
 * <p>Visual contract (per ux-principles + savings reference):
 * <ul>
 *   <li>Height 56px (1× safe-area friendly on mobile).</li>
 *   <li>Title — `--font-size-h1` (22px) primary text color.</li>
 *   <li>Back arrow — Material `arrow_back` icon, top-left, primary text color.</li>
 *   <li>Background transparent — inherits {@code --pgz-app-bg}.</li>
 * </ul>
 *
 * <p>Migration note: `pgz-prev-route` stays for the auth-container shell
 * (different visual lineage). All other usages move to this component
 * over M5.6 PR2.
 */
@Component({
  selector: 'pgz-page-header',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeaderComponent {
  private readonly location = inject(Location);

  /** Page title — usually a noun: "Portfolio", "My holdings", "Settings". */
  @Input({ required: true }) public title!: string;

  /** Show back arrow on the left. Default off for top-level pages. */
  @Input() public showBack = false;

  /**
   * Emitted when the user taps back. If the parent doesn't bind it, the
   * component falls back to {@code Location.back()} so the common case
   * "just go back to previous route" needs zero wiring.
   */
  @Output() public readonly back = new EventEmitter<void>();

  public onBack(): void {
    if (this.back.observed) {
      this.back.emit();
    } else {
      this.location.back();
    }
  }
}
