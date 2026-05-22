import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/**
 * Reusable empty-state surface (M5.6 PR4).
 *
 * <p>Replaces the per-page `.savings__empty`, `.hl__empty`, `.al__empty`,
 * `.tags-page__empty`, `.sheet__empty` ad-hoc blocks with a single visual
 * vocabulary: optional icon glyph + bold title + muted hint + optional
 * CTA slot. Per ux-principles §"Empty states are first-class screens".
 *
 * <p>Three usage patterns:
 * <ul>
 *   <li><b>Title only</b>: `<pgz-empty-state title="No tags yet." />`</li>
 *   <li><b>Title + hint</b>: add `[hint]`.</li>
 *   <li><b>Title + hint + CTA</b>: project a button via
 *       `<ng-content select="[cta]">`.</li>
 * </ul>
 *
 * <p>Icon is an optional string — either a single emoji ("📥") or any
 * UTF glyph. Material `<mat-icon>` not adopted here to keep the
 * component dependency-free (callers using mat-icon can wrap it via the
 * CTA slot if needed).
 */
@Component({
  selector: 'pgz-empty-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  /** Bold first line. Required — empty-state without a title is just a gap. */
  @Input({ required: true }) public title!: string;

  /** Optional muted second line — context, instruction, or "why empty". */
  @Input() public hint?: string;

  /** Optional emoji/glyph above the title. e.g. "📥", "🏦", "🔍". */
  @Input() public icon?: string;

  /**
   * Visual density. `compact` (default) — vertical padding 16px, fits
   * inside cards and sheets. `roomy` — padding 32px, fits as a whole
   * page surface (savings/holdings empty body).
   */
  @Input() public size: 'compact' | 'roomy' = 'compact';
}
