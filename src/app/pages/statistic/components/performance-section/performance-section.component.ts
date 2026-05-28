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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { IHoldingView } from '../../../../domain/holding.domain';
import { IPosition } from '../../../../domain/position.domain';
import { ITag } from '../../../../domain/tag.domain';
import { SUPPORTED_BASE_CURRENCIES } from '../../../../domain/user-preferences.domain';
import { EmptyStateComponent } from '../../../../core/UI/components/empty-state/empty-state.component';
import { CurrencySymbolPipe } from '../../../../pipe/currency-symbol.pipe';
import { FxRateService } from '../../../../service/fx-rate.service';
import { HoldingService } from '../../../savings/service/holding.service';
import { InstrumentService } from '../../../savings/service/instrument.service';
import { LivePriceService } from '../../../savings/service/live-price.service';
import { PositionsService } from '../../../savings/service/positions.service';
import { UserPreferencesService } from '../../../savings/service/user-preferences.service';
import { selectHoldingsList } from '../../../savings/store/holdings.selectors';
import {
  GainBySource,
  TopMover,
  computeGainBySource,
  computeTopMovers,
} from '../../model/performance-stats.helper';

interface DonutArc {
  colorVar: string;
  dash: number;
  offset: number;
}

/**
 * Performance section of `/statistic` (mockup §07), data-driven and
 * frontend-only — works for anonymous users straight off localStorage
 * holdings (ADR-0012). Renders:
 *
 *  - **Nominal P&L · all-time** hero — Σ paper P&L in baseCurrency. The
 *    inflation-adjusted "real return" + period filters (1Y/3Y/…) need a
 *    portfolio-history backend (Wave 2 Block B), so they're surfaced as
 *    a "coming soon" line, not faked.
 *  - **Where gains came from** — per-class gain donut + legend.
 *  - **Top movers** — best / worst position by P&L %.
 *  - **Income · dividends** — backend-blocked (needs payment history),
 *    shown as a "coming soon" placeholder per stats plan Q2 Variant A.
 *
 * Data pipeline mirrors `PortfolioSummaryComponent`: store holdings →
 * join instruments → `PositionsService` → FX-normalise via
 * `FxRateService.toBase`. The section owns its own service bootstrap so
 * it renders correctly whether the user lands here directly or via
 * Savings.
 */
@Component({
  selector: 'pgz-stats-performance-section',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent, CurrencySymbolPipe],
  templateUrl: './performance-section.component.html',
  styleUrl: './performance-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerformanceSectionComponent implements OnInit {
  /** Donut radius 30 → circumference 2π·30. Matches mockup §07 geometry. */
  public readonly circumference = 2 * Math.PI * 30;

  /**
   * Period toggle segments (mockup §07). The selector is interactive and
   * drives the WHOLE summary card. Only `All` is live right now — it maps
   * to the all-time nominal P&L we compute from cost basis. The
   * time-window filters (1M…5Y) need a portfolio-history backend (Wave 2
   * Block B); selecting one flips the card body to an honest "coming
   * soon" state rather than faking a period return. Resolves the mockup's
   * open question "default 1Y or All while history is thin?" → All.
   */
  public readonly periods: readonly string[] = ['1M', '3M', '1Y', '3Y', '5Y', 'All'];

  private readonly _selectedPeriod = signal<string>('All');
  public readonly selectedPeriod = this._selectedPeriod.asReadonly();

  /** True for the only period we can compute without history (cost-basis
   *  lifetime P&L). Drives the real-data vs coming-soon card body. */
  public readonly isAllTime = computed(() => this._selectedPeriod() === 'All');

  public selectPeriod(period: string): void {
    this._selectedPeriod.set(period);
  }

  private readonly store = inject(Store);
  private readonly holdings = inject(HoldingService);
  private readonly instruments = inject(InstrumentService);
  private readonly livePrice = inject(LivePriceService);
  private readonly positionsSvc = inject(PositionsService);
  private readonly fxRate = inject(FxRateService);
  private readonly userPrefs = inject(UserPreferencesService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly rawHoldings = this.store.selectSignal(selectHoldingsList);

  /** Holdings joined with their instrument. Tags are irrelevant to
   *  performance maths, so we skip resolving them (empty array). */
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

  public readonly displayCurrency = computed<string>(
    () => this.userPrefs.baseCurrency() ?? 'USD',
  );

  public readonly hasData = computed<boolean>(
    () => this.positions().length > 0,
  );

  public readonly gainBySource = computed<GainBySource>(() => {
    const base = this.displayCurrency();
    return computeGainBySource(this.positions(), (amount, cur) =>
      this.fxRate.toBase(amount, cur, base),
    );
  });

  public readonly bestMover = computed<TopMover | null>(() => {
    const base = this.displayCurrency();
    return computeTopMovers(this.positions(), (amount, cur) =>
      this.fxRate.toBase(amount, cur, base),
    ).best;
  });

  public readonly worstMover = computed<TopMover | null>(() => {
    const base = this.displayCurrency();
    return computeTopMovers(this.positions(), (amount, cur) =>
      this.fxRate.toBase(amount, cur, base),
    ).worst;
  });

  /** Pre-computed SVG arc geometry for the donut (stroke-dasharray). */
  public readonly donutArcs = computed<DonutArc[]>(() => {
    const segments = this.gainBySource().segments;
    let acc = 0;
    return segments.map((s) => {
      const dash = s.share * this.circumference;
      const arc: DonutArc = { colorVar: s.colorVar, dash, offset: -acc };
      acc += dash;
      return arc;
    });
  });

  ngOnInit(): void {
    // Idempotent service bootstrap (same calls Savings makes). Ensures
    // holdings/instruments/prices are live even when the user opens
    // /statistic directly without visiting Savings first.
    this.instruments.init();
    this.holdings.init();
    this.livePrice.init();

    // Preload the full supported FX set against base so the synchronous
    // gain/mover computeds resolve conversions instead of falling back to
    // raw amounts (anonymous-safe — /fx-rates is permitAll).
    const base = this.displayCurrency();
    this.fxRate
      .preload(base, [...SUPPORTED_BASE_CURRENCIES])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  // ---- Display helpers ----

  /** `+1,840` / `−1,200` — whole units, sign prefix, no symbol (template
   *  prefixes the base-currency glyph separately). */
  public formatSigned(value: number): string {
    const sign = value >= 0 ? '+' : '−';
    return sign + Math.round(Math.abs(value)).toLocaleString('en-US');
  }

  /** `25.2k` / `204k` / `950` — compact, no symbol. */
  public formatCompact(value: number): string {
    const abs = Math.abs(value);
    if (abs >= 1000) {
      const k = abs / 1000;
      return `${k.toLocaleString('en-US', { maximumFractionDigits: 1 })}k`;
    }
    return Math.round(abs).toLocaleString('en-US');
  }

  /** `+34%` / `−2%` from a fraction (0.34 → +34%). */
  public formatPct(fraction: number): string {
    const sign = fraction >= 0 ? '+' : '−';
    const pct = Math.abs(fraction) * 100;
    return `${sign}${pct.toLocaleString('en-US', { maximumFractionDigits: 1 })}%`;
  }

  /** `44%` — whole-percent share for the legend. */
  public formatShare(share: number): string {
    const pct = share * 100;
    return pct >= 1 ? `${Math.round(pct)}%` : '<1%';
  }
}
