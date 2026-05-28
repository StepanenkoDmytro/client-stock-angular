import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  QueryList,
  ViewChildren,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { Router } from '@angular/router';
import { StressTestSheetComponent } from './components/stress-test-sheet/stress-test-sheet.component';
import { PerformanceSectionComponent } from './components/performance-section/performance-section.component';
import { RiskSectionComponent } from './components/risk-section/risk-section.component';
// Risk-section widgets (SPOF, custody, jurisdiction, currency exposure)
// stay on disk under components/portfolio-stats/widgets/ but are NOT
// imported here — the demo state of /statistic uses hardcoded inline
// HTML per mockup §08 v3 (which retired SPOF/Concentration/Jurisdiction
// per «Removed per user feedback»). Wire the live widgets back in once
// real-data versions of Volatility / Custody / Data freshness ship.

/**
 * /statistic — 3-section single-screen dashboard per approved mockups
 * (design/analytics/04 + 07-performance, 08-risk, 09-goals — all
 * 2026-05-22+).
 *
 * Layout: header → sticky anchor nav (Performance / Risk / Goals)
 * → three stacked sections on one scrollable page. Anchor nav buttons
 * scroll-jump to sections; an IntersectionObserver back-syncs the
 * active anchor when the user scrolls.
 *
 * Current PR (shell + risk widgets only):
 *   • Risk section — wires the 3 widgets already shipped in Phase 5
 *     (SPOF, crypto custody mix, jurisdiction). Currency exposure
 *     widget is mocked-out and lands in a follow-up PR.
 *   • Performance + Goals sections render placeholder cards.
 *     Real widgets (real return, vs benchmark, yield on platforms,
 *     dividends YTD; goals + forward projection) come in their own
 *     PRs — they depend on backend work outside this scope (M5.7).
 *
 * Account-axis widgets shipped in Phase 5 (account-count chips,
 * per-account / per-class breakdowns) are no longer rendered here —
 * the new mockup scope drops them from /statistic. The components
 * stay on disk in `components/portfolio-stats/widgets/` so they can
 * later move to a future Account-detail screen without rewrite.
 */
type SectionId = 'performance' | 'risk' | 'goals';

interface AnchorOption {
  readonly id: SectionId;
  readonly label: string;
}

@Component({
  selector: 'pgz-statistic',
  standalone: true,
  imports: [PerformanceSectionComponent, RiskSectionComponent],
  templateUrl: './statistic.component.html',
  styleUrl: './statistic.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatisticComponent implements AfterViewInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly router = inject(Router);

  protected readonly anchors: ReadonlyArray<AnchorOption> = [
    { id: 'performance', label: 'Performance' },
    { id: 'risk', label: 'Risk' },
    { id: 'goals', label: 'Goals' },
  ];

  protected readonly activeSection = signal<SectionId>('performance');

  @ViewChildren('sectionEl') private sectionRefs!: QueryList<ElementRef<HTMLElement>>;

  private observer: IntersectionObserver | null = null;

  ngAfterViewInit(): void {
    // Anchor scroll-spy. The anchor nav sits ~128px from the top once
    // the page has scrolled, so we offset the rootMargin to flip the
    // active section as it crosses the nav baseline (not the viewport
    // edge). threshold [0] is enough — we don't care about partial
    // visibility ratios, just "did the boundary cross."
    this.observer = new IntersectionObserver(
      (entries) => {
        // Prefer the section closest to the top that's still inside the
        // observation root — matches the user-perceived "current" one.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          const id = visible[0].target.id as SectionId;
          this.activeSection.set(id);
        }
      },
      {
        rootMargin: '-128px 0px -55% 0px',
        threshold: [0],
      },
    );

    this.sectionRefs.forEach((ref) => this.observer?.observe(ref.nativeElement));

    // Re-observe if the section list ever changes (later PRs may toggle
    // sections conditionally based on data presence).
    this.sectionRefs.changes
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.observer?.disconnect();
        this.sectionRefs.forEach((ref) =>
          this.observer?.observe(ref.nativeElement),
        );
      });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.observer = null;
  }

  protected scrollTo(id: SectionId): void {
    const el = document.getElementById(id);
    if (!el) return;
    // Set active immediately so the underline moves on tap, even when
    // the whole page fits in the viewport and IntersectionObserver
    // won't fire (cold-start with empty widgets). Observer will
    // overwrite on subsequent scroll, which is the desired ordering.
    this.activeSection.set(id);
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /**
   * Opens the Stress test bottom sheet (mockup §12). Triggered from
   * the Volatility profile card's «Stress test →» link.
   */
  protected openStressTest(): void {
    this.bottomSheet.open(StressTestSheetComponent, {
      panelClass: 'pgz-stress-test-sheet-panel',
    });
  }

  /**
   * Opens the Dividend schedule detail screen (mockup §10). Triggered
   * from the Performance section's "Dividends · YTD ›" row.
   */
  protected openDividendSchedule(): void {
    this.router.navigate(['/statistic/dividend-schedule']);
  }
}
