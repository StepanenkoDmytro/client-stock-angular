import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
} from '@angular/core';
import { PortfolioOverview } from '../../../../../../domain/portfolio-overview.domain';
import { PortfolioOverviewService } from '../../../../../savings/service/portfolio-overview.service';

/**
 * One row in the currency-exposure breakdown. Built client-side from
 * the existing {@link PortfolioOverview} response — we have no
 * dedicated currency-exposure endpoint, so this widget pivots the
 * per-class breakdown that the overview already carries.
 */
export interface CurrencyExposureRow {
  /** ISO 4217 (e.g. 'USD', 'EUR') or the synthetic '_mixed' sentinel. */
  readonly currency: string;
  readonly valueBase: number;
  readonly share: number;
  /**
   * Sum of native amounts. {@code null} for the synthetic `_mixed`
   * row — each mixed-currency class contributes a different native
   * unit so they cannot be summed.
   */
  readonly valueNative: number | null;
}

/** Synthetic key for classes with `nativeCurrency==null` (multi-currency). */
const MIXED_KEY = '_mixed';

/**
 * W7 — Currency exposure. Stacked-bar + legend of the user's holdings
 * grouped by native pricing currency, normalised to baseCurrency for
 * the share calculation.
 *
 * <p>Per mockup §04 Frame 2: 3-segment bar with USD/EUR/UAH/…, legend
 * dot + code + share + native amount, footer "Base currency: X · FX
 * rate from ECB · updated daily".
 *
 * <p>Derivation strategy: the backend does not expose a dedicated
 * per-currency endpoint (yet), so we pivot the existing
 * {@link PortfolioOverview} response. Each {@link ClassBreakdown}
 * carries `nativeCurrency` + `nativeValue` for asset classes whose
 * holdings all share one currency — those rows feed their own bucket.
 * Classes that hold positions in multiple currencies surface
 * `nativeCurrency=null` from the backend; we accumulate them into a
 * synthetic "Mixed" bucket so the total still reconciles with
 * {@link PortfolioOverview#total}.
 *
 * <p>Self-hide rules:
 *   • No overview data yet → no card (anonymous user / pre-load).
 *   • Single-currency portfolio (1 distinct currency, no mixed) →
 *     no card (the share would always be 100%, no signal).
 *
 * <p>The widget does not re-fetch — it consumes the same signal that
 * the Savings dashboard already populated via
 * {@link PortfolioOverviewService#refresh}.
 */
@Component({
  selector: 'pgz-currency-exposure',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './currency-exposure.component.html',
  styleUrl: './currency-exposure.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CurrencyExposureComponent implements OnInit {
  private readonly overviewService = inject(PortfolioOverviewService);

  public readonly overview = this.overviewService.latest;

  /**
   * Derived currency breakdown. Sorted by `valueBase` descending so
   * the largest share appears first in both bar and legend.
   */
  public readonly rows = computed<CurrencyExposureRow[]>(() => {
    const o = this.overview();
    if (!o) return [];
    return buildCurrencyExposure(o);
  });

  /** `true` once we have ≥ 2 distinct slices (including the mixed bucket). */
  public readonly hasMultipleCurrencies = computed<boolean>(
    () => this.rows().length >= 2,
  );

  public ngOnInit(): void {
    // Trigger a fetch if no overview is cached yet. Caller pages (e.g.
    // /savings) also call this — duplicate calls inside the service
    // collapse cleanly because the cached signal updates atomically.
    if (!this.overview()) {
      this.overviewService.refresh().subscribe({
        error: () => {
          // Anonymous / 401 / network error: service has already
          // logged. Widget self-hides via rows().length === 0.
        },
      });
    }
  }

  /**
   * Width of the bar segment for a given share (0..1). Floors at 2%
   * so a tiny slice still renders a visible sliver rather than
   * disappearing entirely.
   */
  public segmentWidth(share: number): number {
    if (!share || share <= 0) return 0;
    return Math.max(share * 100, 2);
  }

  /** ISO 4217 → CSS colour for the segment. */
  public colorFor(currency: string): string {
    // Hand-picked palette mirroring the mockup (USD blue, EUR purple,
    // UAH amber, GBP green) with fallbacks for the rest of the
    // supported set. CSS variables let dark theme override if/when
    // we add those tokens globally; until then the defaults match.
    switch (currency) {
      case 'USD':
        return 'var(--cx-color-usd, #185FA5)';
      case 'EUR':
        return 'var(--cx-color-eur, #7F77DD)';
      case 'UAH':
        return 'var(--cx-color-uah, #BA7517)';
      case 'GBP':
        return 'var(--cx-color-gbp, #0F6E56)';
      case 'PLN':
        return 'var(--cx-color-pln, #A32D2D)';
      case 'CHF':
        return 'var(--cx-color-chf, #3D8270)';
      case 'JPY':
        return 'var(--cx-color-jpy, #888780)';
      case MIXED_KEY:
        return 'var(--cx-color-mixed, #888780)';
      default:
        return 'var(--cx-color-other, #5F5E5A)';
    }
  }

  /** User-visible label. Maps the `_mixed` sentinel to a readable copy. */
  public labelFor(currency: string): string {
    return currency === MIXED_KEY ? 'Mixed' : currency;
  }

  public formatPct(share: number): string {
    if (!share) return '0%';
    const pct = share * 100;
    return pct >= 1 ? `${Math.round(pct)}%` : `${pct.toFixed(1)}%`;
  }

  /**
   * Native-amount cell. Returns `null` for the mixed bucket (the
   * template treats null as "blank cell, no number") because the
   * underlying classes use different units.
   */
  public formatNative(row: CurrencyExposureRow): string | null {
    if (row.valueNative == null) return null;
    const formatted = new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(row.valueNative);
    return `${formatted} ${row.currency}`;
  }

  public trackByCurrency(_i: number, row: CurrencyExposureRow): string {
    return row.currency;
  }
}

/**
 * Pure projection from {@link PortfolioOverview} to per-currency rows.
 * Exported only for tests; the component reads the {@link rows} signal.
 */
export function buildCurrencyExposure(
  overview: PortfolioOverview,
): CurrencyExposureRow[] {
  if (!overview.breakdown.length || overview.total <= 0) return [];

  const baseBuckets = new Map<string, { valueBase: number; valueNative: number | null }>();

  for (const slice of overview.breakdown) {
    const key = slice.nativeCurrency ?? MIXED_KEY;
    const cur = baseBuckets.get(key);
    const addedNative = slice.nativeValue ?? null;
    if (!cur) {
      baseBuckets.set(key, {
        valueBase: slice.value,
        // For mixed buckets keep `null` — multiple native units can't
        // sum to one number. For uniform-currency slices accumulate.
        valueNative: key === MIXED_KEY ? null : addedNative,
      });
    } else {
      cur.valueBase += slice.value;
      if (key !== MIXED_KEY && cur.valueNative != null && addedNative != null) {
        cur.valueNative += addedNative;
      }
    }
  }

  const total = overview.total;
  const rows: CurrencyExposureRow[] = [];
  for (const [currency, agg] of baseBuckets.entries()) {
    rows.push({
      currency,
      valueBase: agg.valueBase,
      valueNative: agg.valueNative,
      share: total > 0 ? agg.valueBase / total : 0,
    });
  }
  rows.sort((a, b) => b.valueBase - a.valueBase);
  return rows;
}
