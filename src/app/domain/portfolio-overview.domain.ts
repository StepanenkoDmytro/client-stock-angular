import { AssetClass } from './asset-class.domain';

/**
 * One per-AssetClass slice of `GET /api/v1/portfolio/overview`. Mirror of
 * backend `ClassBreakdownDto` (M3 / ADR-0002).
 *
 *  - `value` and `nativeValue` arrive as strings? No — Jackson serialises
 *    `BigDecimal` as JSON number. We type as `number` and rely on the UI
 *    to format. Large totals (>2^53) would lose precision, but a personal
 *    portfolio never approaches that.
 *  - `nativeCurrency` and `nativeValue` are both `null` when the class
 *    holds positions in multiple currencies. UI then shows only the
 *    base-currency value.
 */
export interface ClassBreakdown {
  assetClass: AssetClass;
  value: number;
  share: number;
  nativeCurrency: string | null;
  nativeValue: number | null;
}

/**
 * Envelope from `GET /api/v1/portfolio/overview`. Mirror of backend
 * `PortfolioOverviewDto`.
 *
 *  - `total` is the sum of all `breakdown[].value` in `baseCurrency`.
 *  - `capturedAt` may arrive as a number (epoch seconds float — Jackson
 *    default for `Instant` on Spring Boot 2.6, known QoL issue from
 *    PR8a §5) or as an ISO-8601 string after the eventual upgrade.
 *  - `stale` is `true` when any FX or price lookup contributing to the
 *    aggregate served a cached value because the upstream was
 *    unreachable — UI surfaces a subtle "data may be outdated" hint.
 */
export interface PortfolioOverview {
  baseCurrency: string;
  total: number;
  breakdown: ClassBreakdown[];
  capturedAt: number | string;
  stale: boolean;
}
