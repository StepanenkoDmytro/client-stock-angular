import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { Store } from '@ngrx/store';
import { AssetClass } from '../../../../domain/asset-class.domain';
import { IHoldingView } from '../../../../domain/holding.domain';
import { IPosition } from '../../../../domain/position.domain';
import { ITag } from '../../../../domain/tag.domain';
import { SUPPORTED_BASE_CURRENCIES } from '../../../../domain/user-preferences.domain';
import { CurrencySymbolPipe } from '../../../../pipe/currency-symbol.pipe';
import { FxRateService } from '../../../../service/fx-rate.service';
import { AccountsService } from '../../../savings/service/accounts.service';
import { HoldingService } from '../../../savings/service/holding.service';
import { InstrumentService } from '../../../savings/service/instrument.service';
import { LivePriceService } from '../../../savings/service/live-price.service';
import { PositionsService } from '../../../savings/service/positions.service';
import { UserPreferencesService } from '../../../savings/service/user-preferences.service';
import { selectHoldingsList } from '../../../savings/store/holdings.selectors';
import { CounterpartyRiskComponent } from '../portfolio-stats/widgets/counterparty-risk/counterparty-risk.component';
import { StressTestSheetComponent } from '../stress-test-sheet/stress-test-sheet.component';
import {
  VolClassRow,
  VolatilityProfile,
  computeVolatilityProfile,
} from '../../model/volatility-stats.helper';

interface DonutArc {
  colorVar: string;
  dash: number;
  offset: number;
}

/**
 * Risk section of `/statistic` (mockup §08). Data-driven, frontend-only.
 *
 *  - **Volatility profile** — value split into coarse risk tiers
 *    (Low / Medium / High) by AssetClass + stablecoin detection, with a
 *    per-class table. A structural proxy (no price history), framed as
 *    "typically" in the copy.
 *  - **Crypto custody mix** — reuses the shipped `pgz-counterparty-risk`
 *    widget (Phase 5). Self-hides when there's no crypto, so we gate the
 *    wrapping card on {@link hasCrypto}.
 *  - **Data freshness** — needs a `lastValuationDate` backend column
 *    (Wave 2 Block D), so it stays an honest "coming soon" placeholder.
 *
 * Owns its own service bootstrap (holdings / instruments / accounts /
 * live prices) so it renders correctly when the user opens /statistic
 * directly. Mirrors `PerformanceSectionComponent`'s data pipeline.
 */
@Component({
  selector: 'pgz-stats-risk-section',
  standalone: true,
  imports: [CommonModule, CurrencySymbolPipe, CounterpartyRiskComponent],
  templateUrl: './risk-section.component.html',
  styleUrl: './risk-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RiskSectionComponent implements OnInit {
  /** Donut radius 30 → circumference 2π·30. Matches mockup §08 geometry. */
  public readonly circumference = 2 * Math.PI * 30;

  /** Tier → theme colour token (Low green / Medium amber / High red). */
  public readonly tierColors: Readonly<Record<'low' | 'medium' | 'high', string>> = {
    low: 'var(--color-positive)',
    medium: 'var(--color-warning)',
    high: 'var(--color-negative)',
  };

  private readonly store = inject(Store);
  private readonly holdings = inject(HoldingService);
  private readonly instruments = inject(InstrumentService);
  private readonly livePrice = inject(LivePriceService);
  private readonly accounts = inject(AccountsService);
  private readonly positionsSvc = inject(PositionsService);
  private readonly fxRate = inject(FxRateService);
  private readonly userPrefs = inject(UserPreferencesService);
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly destroyRef = inject(DestroyRef);

  private readonly rawHoldings = this.store.selectSignal(selectHoldingsList);

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

  public readonly hasData = computed<boolean>(() => this.positions().length > 0);

  /** Gate the custody-mix card — the widget self-hides without crypto, so
   *  we avoid rendering an empty card around it. */
  public readonly hasCrypto = computed<boolean>(() =>
    this.positions().some((p) => p.instrument?.assetClass === AssetClass.CRYPTO),
  );

  public readonly volatility = computed<VolatilityProfile>(() => {
    const base = this.displayCurrency();
    return computeVolatilityProfile(this.positions(), (amount, cur) =>
      this.fxRate.toBase(amount, cur, base),
    );
  });

  /** SVG arc geometry for the 3-tier volatility donut. */
  public readonly donutArcs = computed<DonutArc[]>(() => {
    const v = this.volatility();
    const shares: ReadonlyArray<[number, string]> = [
      [v.lowShare, this.tierColors.low],
      [v.mediumShare, this.tierColors.medium],
      [v.highShare, this.tierColors.high],
    ];
    let acc = 0;
    const arcs: DonutArc[] = [];
    for (const [share, colorVar] of shares) {
      if (share <= 0) continue;
      const dash = share * this.circumference;
      arcs.push({ colorVar, dash, offset: -acc });
      acc += dash;
    }
    return arcs;
  });

  ngOnInit(): void {
    // Idempotent bootstrap — accounts included (custody mix needs them).
    this.instruments.init();
    this.holdings.init();
    this.accounts.init();
    this.livePrice.init();

    const base = this.displayCurrency();
    this.fxRate
      .preload(base, [...SUPPORTED_BASE_CURRENCIES])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  /**
   * Opens the Stress test bottom sheet (mockup §08 «Stress test →» link /
   * §12 sheet). The sheet content itself is still the demo build (A8) —
   * the link is the design's entry point, restored here.
   */
  public openStressTest(): void {
    this.bottomSheet.open(StressTestSheetComponent, {
      panelClass: 'pgz-stress-test-sheet-panel',
    });
  }

  // ---- Display helpers ----

  /** Per-tier fractions of a class row, as ordered bar segments. */
  public classBarSegments(
    row: VolClassRow,
  ): ReadonlyArray<{ colorVar: string; fraction: number }> {
    return [
      { colorVar: this.tierColors.low, fraction: row.lowFraction },
      { colorVar: this.tierColors.medium, fraction: row.mediumFraction },
      { colorVar: this.tierColors.high, fraction: row.highFraction },
    ].filter((s) => s.fraction > 0);
  }

  /** `41k` / `204k` / `950` — compact, no symbol. */
  public formatCompact(value: number): string {
    const abs = Math.abs(value);
    if (abs >= 1000) {
      const k = abs / 1000;
      return `${k.toLocaleString('en-US', { maximumFractionDigits: 1 })}k`;
    }
    return Math.round(abs).toLocaleString('en-US');
  }

  /** `54%` — whole-percent share. */
  public formatShare(share: number): string {
    const pct = share * 100;
    return pct >= 1 ? `${Math.round(pct)}%` : '<1%';
  }
}
