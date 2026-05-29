import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Store } from '@ngrx/store';
import { IGoal } from '../../../../domain/goals.domain';
import { IHoldingView } from '../../../../domain/holding.domain';
import {
  ILiability,
  LiabilityType,
  isRevolvingLiability,
} from '../../../../domain/liability.domain';
import { IPosition } from '../../../../domain/position.domain';
import { ITag } from '../../../../domain/tag.domain';
import { SUPPORTED_BASE_CURRENCIES } from '../../../../domain/user-preferences.domain';
import { CurrencySymbolPipe } from '../../../../pipe/currency-symbol.pipe';
import { FxRateService } from '../../../../service/fx-rate.service';
import { GoalsService } from '../../../../service/goals.service';
import { LiabilitiesService } from '../../../../service/liabilities.service';
import { HoldingService } from '../../../savings/service/holding.service';
import { InstrumentService } from '../../../savings/service/instrument.service';
import { LivePriceService } from '../../../savings/service/live-price.service';
import { PositionsService } from '../../../savings/service/positions.service';
import { UserPreferencesService } from '../../../savings/service/user-preferences.service';
import {
  NetWorthBreakdown,
  computeNetWorth,
  debtPayoffProgress,
} from '../../../savings/model/net-worth.helper';
import { selectHoldingsList } from '../../../savings/store/holdings.selectors';
import {
  REALISTIC_RATE,
  RETURN_SCENARIOS,
  buildProjectionSeries,
  monthsToReach,
  projectFutureValue,
  requiredMonthlyContribution,
} from '../../model/projection-stats.helper';
import {
  GoalEditorSheetComponent,
  GoalEditorSheetData,
  GoalEditorSheetResult,
} from './goal-editor-sheet/goal-editor-sheet.component';

/**
 * Unified goal row — covers both savings goals (`IGoal`) and debt-payoff
 * goals derived from term liabilities (ADR-0009 §14). `isDebt` switches
 * the label («$X left» vs «€X of €Y»), bar colour (slate) and hides Gap.
 */
interface GoalRow {
  key: string;
  isDebt: boolean;
  icon: string;
  name: string;
  progress: number; // 0..1
  done: boolean;
  dateLabel: string | null;
  dateMs: number | null;
  // savings-only
  saved: number;
  target: number;
  // debt-only (base currency)
  leftAmount: number;
  rate: number;
  /** Source savings goal — present for savings rows, drives the per-row
   *  Edit / Archive / Delete menu. Absent for auto-derived debt rows. */
  goal?: IGoal;
}

interface ChartLine {
  key: string;
  label: string;
  colorVar: string;
  points: string; // SVG polyline points
  endValue: number;
  endY: number;
}

interface ProjectionChart {
  lines: ChartLine[];
  yMax: number;
  years: number;
  /** Horizontal goal line (savings closest goal). */
  goalY: number | null;
  goalValue: number | null;
  /** Vertical freedom-date marker (debt closest goal) — ADR-0009 §14. */
  freedomX: number | null;
  freedomLabel: string | null;
}

const PROJECTION_YEARS = 10;
const CONTRIBUTION_MAX = 2000;
const CONTRIBUTION_STEP = 50;

// Chart plot box (viewBox 0 0 320 150).
const PLOT = { left: 40, right: 300, top: 12, bottom: 112 } as const;

const SCENARIO_COLORS: Readonly<Record<string, string>> = {
  optimistic: 'var(--color-positive)',
  realistic: 'var(--pgz-accent)',
  conservative: 'var(--pgz-text-muted)',
};

const LIABILITY_LABELS: Readonly<Record<LiabilityType, string>> = {
  MORTGAGE: 'Mortgage',
  CREDIT_CARD: 'Credit card',
  PERSONAL_LOAN: 'Personal loan',
  AUTO_LOAN: 'Auto loan',
  STUDENT_LOAN: 'Student loan',
  MARGIN_LOAN: 'Margin loan',
  BNPL: 'Buy now, pay later',
  OTHER: 'Loan',
};

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

/**
 * Goals section of `/statistic` (mockups §09 + §14). Frontend-only,
 * anonymous-safe.
 *
 *  - **Forward / net-worth projection** — compound growth of the user's
 *    current **net worth** (assets − liabilities, ADR-0009 L8) plus a
 *    monthly contribution, across 3 return scenarios (4 / 6 / 8 %).
 *  - **What-if contribution** — user-driven slider; projection, hero ETA
 *    and gap recompute reactively. Auto-detecting a saving rate needs
 *    income / net-worth history (Wave 2) → manual control with a note.
 *  - **Goals list** — savings goals (`GoalsService`) + auto-created
 *    debt-payoff goals from term liabilities (`LiabilitiesService`).
 *  - **Gap analysis** — adaptive; savings goals only. Hidden for debt
 *    (anti-shaming boundary, ADR-0009).
 */
@Component({
  selector: 'pgz-stats-goals-section',
  standalone: true,
  imports: [
    CommonModule,
    CurrencySymbolPipe,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
  ],
  templateUrl: './goals-section.component.html',
  styleUrl: './goals-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoalsSectionComponent implements OnInit {
  public readonly contributionMax = CONTRIBUTION_MAX;
  public readonly contributionStep = CONTRIBUTION_STEP;
  public readonly projectionYears = PROJECTION_YEARS;

  private readonly store = inject(Store);
  private readonly holdings = inject(HoldingService);
  private readonly instruments = inject(InstrumentService);
  private readonly livePrice = inject(LivePriceService);
  private readonly positionsSvc = inject(PositionsService);
  private readonly fxRate = inject(FxRateService);
  private readonly userPrefs = inject(UserPreferencesService);
  private readonly goalsService = inject(GoalsService);
  private readonly liabilitiesService = inject(LiabilitiesService);
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly destroyRef = inject(DestroyRef);

  /** Whether the collapsed «Archived (N)» group is expanded (mockup
   *  analytics/16 frame 2). */
  public readonly showArchived = signal(false);

  private readonly rawHoldings = this.store.selectSignal(selectHoldingsList);

  private readonly goals = toSignal(this.goalsService.getAll(), {
    initialValue: [] as IGoal[],
  });

  private readonly liabilities = toSignal(this.liabilitiesService.getAll(), {
    initialValue: [] as ILiability[],
  });

  /** User-set monthly contribution (the what-if slider). Starts at 0 —
   *  honest "you haven't set a contribution yet". */
  private readonly _contribution = signal<number>(0);
  public readonly contribution = this._contribution.asReadonly();

  public readonly displayCurrency = computed<string>(
    () => this.userPrefs.baseCurrency() ?? 'USD',
  );

  private readonly holdingsView = computed<IHoldingView[]>(() => {
    const instrMap = this.instruments.instruments();
    const result: IHoldingView[] = [];
    for (const h of this.rawHoldings()) {
      const instrument = instrMap.get(h.instrumentId);
      if (!instrument) continue;
      result.push({ ...h, instrument, tags: [] as ITag[] });
    }
    return result;
  });

  private readonly positions = computed<IPosition[]>(() =>
    this.positionsSvc.fromHoldings(this.holdingsView(), (symbol) =>
      this.holdings.getCurrentPrice(symbol),
    ),
  );

  /** Gross portfolio value (assets) in base currency. */
  public readonly portfolioValue = computed<number>(() => {
    const base = this.displayCurrency();
    return this.positions().reduce(
      (sum, p) =>
        sum + this.fxRate.toBase(p.totalValue, p.instrument?.currency, base),
      0,
    );
  });

  /** Net worth = assets − liabilities (ADR-0009 L2). */
  public readonly netWorth = computed<NetWorthBreakdown>(() => {
    const base = this.displayCurrency();
    return computeNetWorth(this.portfolioValue(), this.liabilities(), (amount, cur) =>
      this.fxRate.toBase(amount, cur, base),
    );
  });

  public readonly hasDebt = computed<boolean>(() => this.netWorth().hasDebt);

  /** Projection start (P0): net worth when there's debt, else gross value
   *  (ADR-0009 L8 — debt-free portfolios are unchanged). */
  public readonly projectionBase = computed<number>(() => {
    const nw = this.netWorth();
    return nw.hasDebt ? nw.netWorth : nw.assetsTotal;
  });

  /** Map a savings `IGoal` → unified row. `saved = share × gross assets`. */
  private toGoalRow(goal: IGoal): GoalRow {
    const assets = this.portfolioValue();
    const target = goal.finishSum ?? 0;
    const saved = (goal.share ?? 0) * assets;
    const progress = target > 0 ? Math.min(1, saved / target) : 0;
    return {
      key: `goal-${goal.id ?? goal.name}`,
      isDebt: false,
      icon: '',
      name: goal.name,
      progress,
      done: progress >= 1,
      dateLabel: this.formatGoalDate(goal.approximateDate),
      dateMs: this.dateMs(goal.approximateDate),
      saved,
      target,
      leftAmount: 0,
      rate: 0,
      goal,
    };
  }

  /** Active savings goals → unified rows. Archived goals are excluded —
   *  they live in the collapsed «Archived (N)» group and shouldn't clutter
   *  the forward projection (mockup analytics/16). */
  private readonly savingsRows = computed<GoalRow[]>(() =>
    this.goals()
      .filter((goal) => !goal.archived)
      .map((goal) => this.toGoalRow(goal)),
  );

  /** Archived savings goals → rows for the collapsed «Archived (N)» group. */
  public readonly archivedRows = computed<GoalRow[]>(() =>
    this.goals()
      .filter((goal) => goal.archived)
      .map((goal) => this.toGoalRow(goal)),
  );

  public readonly archivedCount = computed<number>(
    () => this.archivedRows().length,
  );

  /**
   * Debt-payoff rows — auto-created from TERM liabilities (mortgage / auto /
   * student / personal). Revolving debts (credit card, BNPL, margin) get no
   * goal: no payoff date by definition (ADR-0009 §14).
   */
  private readonly debtRows = computed<GoalRow[]>(() => {
    const base = this.displayCurrency();
    return this.liabilities()
      .filter((l) => !isRevolvingLiability(l.type) && (l.originalAmount ?? 0) > 0)
      .map((l) => {
        const progress = debtPayoffProgress(
          l.originalAmount ?? 0,
          l.principalBalance ?? 0,
        );
        const ms = this.dateMs(l.endDate);
        return {
          key: `debt-${l.id ?? l.type}`,
          isDebt: true,
          icon: '🏦',
          name: l.lender || l.notes || LIABILITY_LABELS[l.type],
          progress,
          done: progress >= 1,
          dateLabel: this.formatGoalDate(l.endDate),
          dateMs: ms,
          saved: 0,
          target: 0,
          leftAmount: this.fxRate.toBase(l.principalBalance ?? 0, l.currency, base),
          rate: l.interestRate ?? 0,
        };
      });
  });

  /** All goal rows for the list — savings first, then debts. */
  public readonly allRows = computed<GoalRow[]>(() => [
    ...this.savingsRows(),
    ...this.debtRows(),
  ]);

  /** Closest dated, not-done goal (savings or debt). Drives hero + gap +
   *  chart marker. */
  public readonly closestGoal = computed<GoalRow | null>(() => {
    const rows = this.allRows();
    if (rows.length === 0) return null;
    const dated = rows
      .filter((r) => !r.done && r.dateMs != null)
      .sort((a, b) => (a.dateMs as number) - (b.dateMs as number));
    if (dated.length > 0) return dated[0];
    const unmet = rows.filter((r) => !r.done);
    return unmet[0] ?? rows[0];
  });

  /** ETA (months) for the closest SAVINGS goal at current contribution + 6%.
   *  Null for debt goals — those use their scheduled payoff date. */
  public readonly closestEtaMonths = computed<number | null>(() => {
    const row = this.closestGoal();
    if (!row || row.isDebt) return null;
    return monthsToReach(row.saved, this.contribution(), REALISTIC_RATE, row.target);
  });

  /**
   * Closest dated, not-done **savings** goal — drives the what-if
   * "reached … earlier" readout. The monthly contribution funds savings,
   * not debt payoff, so this deliberately ignores debt rows (the absolute
   * closest goal — {@link closestGoal} — may be a debt).
   */
  public readonly closestSavingsGoal = computed<GoalRow | null>(() => {
    const rows = this.savingsRows().filter((r) => !r.done);
    if (rows.length === 0) return null;
    const dated = rows
      .filter((r) => r.dateMs != null)
      .sort((a, b) => (a.dateMs as number) - (b.dateMs as number));
    return dated[0] ?? rows[0];
  });

  /** ETA (months) to the closest savings goal with NO contribution — the
   *  growth-only baseline the what-if delta is measured against. */
  private readonly baselineSavingsEtaMonths = computed<number | null>(() => {
    const row = this.closestSavingsGoal();
    if (!row) return null;
    return monthsToReach(row.saved, 0, REALISTIC_RATE, row.target);
  });

  /** ETA (months) to the closest savings goal at the CURRENT contribution. */
  public readonly currentSavingsEtaMonths = computed<number | null>(() => {
    const row = this.closestSavingsGoal();
    if (!row) return null;
    return monthsToReach(
      row.saved,
      this.contribution(),
      REALISTIC_RATE,
      row.target,
    );
  });

  /**
   * How many months sooner the closest savings goal is reached at the
   * current contribution vs the growth-only baseline — the slider's
   * time-impact. `null` when there's no savings goal, it's unreachable, or
   * the contribution doesn't move the date (so the line hides at 0/mo).
   */
  public readonly monthsEarlier = computed<number | null>(() => {
    const base = this.baselineSavingsEtaMonths();
    const now = this.currentSavingsEtaMonths();
    if (base == null || now == null) return null;
    const delta = base - now;
    return delta > 0 ? delta : null;
  });

  /** Realistic-scenario projected value at the end of the horizon. */
  public readonly projectedRealistic = computed<number>(() =>
    projectFutureValue(
      this.projectionBase(),
      this.contribution(),
      REALISTIC_RATE,
      PROJECTION_YEARS,
    ),
  );

  /**
   * Gap to the closest dated SAVINGS goal. Hidden for debt goals
   * (anti-shaming, ADR-0009). `null` when not applicable.
   */
  public readonly gap = computed<{
    goalName: string;
    required: number;
    current: number;
    shortBy: number;
    dateLabel: string;
  } | null>(() => {
    const row = this.closestGoal();
    if (!row || row.isDebt || row.dateMs == null) return null;
    const months = this.monthsUntilMs(row.dateMs);
    if (months <= 0) return null;
    const required = requiredMonthlyContribution(
      row.saved,
      row.target,
      REALISTIC_RATE,
      months,
    );
    if (required == null) return null;
    const current = this.contribution();
    const shortBy = required - current;
    if (shortBy <= 0) return null; // on track or ahead — hide
    return {
      goalName: row.name,
      required,
      current,
      shortBy,
      dateLabel: row.dateLabel ?? '',
    };
  });

  public readonly chart = computed<ProjectionChart>(() => {
    const p0 = this.projectionBase();
    const contrib = this.contribution();
    const years = PROJECTION_YEARS;

    const series = RETURN_SCENARIOS.map((s) => ({
      scenario: s,
      points: buildProjectionSeries(p0, contrib, s.rate, years),
    }));

    const closest = this.closestGoal();
    const goalValue = closest && !closest.isDebt ? closest.target : null;
    const maxSeriesValue = Math.max(
      1,
      ...series.map((s) => s.points[s.points.length - 1].value),
    );
    const yMax =
      goalValue != null ? Math.max(maxSeriesValue, goalValue) : maxSeriesValue;

    const x = (year: number): number =>
      PLOT.left + (Math.min(year, years) / years) * (PLOT.right - PLOT.left);
    const y = (value: number): number =>
      PLOT.bottom - (value / yMax) * (PLOT.bottom - PLOT.top);

    const lines: ChartLine[] = series.map((s) => {
      const end = s.points[s.points.length - 1].value;
      return {
        key: s.scenario.key,
        label: s.scenario.label,
        colorVar: SCENARIO_COLORS[s.scenario.key],
        points: s.points.map((p) => `${x(p.year)},${y(p.value)}`).join(' '),
        endValue: end,
        endY: y(end),
      };
    });

    // Debt freedom-date marker — vertical line at the closest debt's payoff
    // year (ADR-0009 §14), instead of a horizontal savings goal line.
    let freedomX: number | null = null;
    let freedomLabel: string | null = null;
    if (closest && closest.isDebt && closest.dateMs != null) {
      const yearsOut = (closest.dateMs - Date.now()) / MS_PER_YEAR;
      if (yearsOut >= 0 && yearsOut <= years) {
        freedomX = x(yearsOut);
        freedomLabel = closest.dateLabel;
      }
    }

    return {
      lines,
      yMax,
      years,
      goalY: goalValue != null ? y(goalValue) : null,
      goalValue,
      freedomX,
      freedomLabel,
    };
  });

  public readonly hasPortfolio = computed<boolean>(
    () => this.portfolioValue() > 0,
  );
  public readonly hasGoals = computed<boolean>(() => this.allRows().length > 0);

  ngOnInit(): void {
    this.instruments.init();
    this.holdings.init();
    this.livePrice.init();

    const base = this.displayCurrency();
    this.fxRate
      .preload(base, [...SUPPORTED_BASE_CURRENCIES])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  public setContribution(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this._contribution.set(Number.isFinite(value) ? value : 0);
  }

  // ---- Goal CRUD (A14, mockup analytics/16) ----

  public toggleArchived(): void {
    this.showArchived.update((open) => !open);
  }

  /** «+ Add» → goal editor in add-mode. */
  public onAddGoal(): void {
    this.openEditor(null);
  }

  /** Per-row ⋯ → Edit. */
  public onEditGoal(row: GoalRow): void {
    if (!row.goal) return;
    this.openEditor(row.goal);
  }

  public onArchiveGoal(row: GoalRow): void {
    if (row.goal) this.goalsService.setArchived(row.goal, true);
  }

  public onRestoreGoal(row: GoalRow): void {
    if (row.goal) this.goalsService.setArchived(row.goal, false);
  }

  public onDeleteGoal(row: GoalRow): void {
    if (row.goal) this.goalsService.deleteGoal(row.goal);
  }

  /** Open the add/edit bottom-sheet; persist on Save (add vs update by the
   *  presence of a source goal). */
  private openEditor(goal: IGoal | null): void {
    const ref = this.bottomSheet.open<
      GoalEditorSheetComponent,
      GoalEditorSheetData,
      GoalEditorSheetResult
    >(GoalEditorSheetComponent, {
      data: { goal, currency: this.displayCurrency() },
      panelClass: 'pgz-goal-editor-sheet-panel',
    });

    ref
      .afterDismissed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (!result || result === 'cancel') return;
        if (goal == null) {
          this.goalsService.addGoal(result.goal);
        } else {
          this.goalsService.updateGoal(result.goal);
        }
      });
  }

  // ---- Display helpers ----

  public formatMoney(value: number): string {
    return Math.round(value).toLocaleString('en-US');
  }

  public formatCompact(value: number): string {
    const abs = Math.abs(value);
    if (abs >= 1000) {
      return `${(abs / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}k`;
    }
    return Math.round(abs).toLocaleString('en-US');
  }

  public formatPct(fraction: number): string {
    return `${Math.round(fraction * 100)}%`;
  }

  /** "8 months" / "2.6 years" / "now" / "—" (unreachable). */
  public etaLabel(months: number | null): string {
    if (months == null) return '—';
    if (months <= 0) return 'now';
    if (months < 12) return `${months} month${months === 1 ? '' : 's'}`;
    return `${(months / 12).toLocaleString('en-US', { maximumFractionDigits: 1 })} years`;
  }

  /** "10 months earlier" / "2.3 years earlier". '' when no positive delta. */
  public earlierLabel(months: number | null): string {
    if (months == null || months <= 0) return '';
    if (months < 12) {
      return `${months} month${months === 1 ? '' : 's'} earlier`;
    }
    return `${(months / 12).toLocaleString('en-US', { maximumFractionDigits: 1 })} years earlier`;
  }

  private formatGoalDate(date: Date | string | undefined): string | null {
    if (!date) return null;
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  private dateMs(date: Date | string | undefined): number | null {
    if (!date) return null;
    const t = new Date(date).getTime();
    return Number.isNaN(t) ? null : t;
  }

  private monthsUntilMs(ms: number): number {
    const d = new Date(ms);
    const now = new Date();
    return (
      (d.getFullYear() - now.getFullYear()) * 12 +
      (d.getMonth() - now.getMonth())
    );
  }
}
