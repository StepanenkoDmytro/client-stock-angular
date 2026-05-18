/** Mirror of Java {@code Session}. */
export type MarketSession = 'REGULAR' | 'CLOSED' | 'WEEKEND' | 'HOLIDAY';

/**
 * Mirror of Java `MarketStatusDto` (`GET /api/v1/markets/status`).
 * Used by `MarketStatusService` and `pgz-market-status-badge`.
 */
export interface MarketStatus {
  code: string;
  isOpen: boolean;
  session: MarketSession;
  /**
   * Next time {@link MarketStatus.isOpen} will flip. Backend currently
   * serialises as epoch-seconds-with-nanos float (Jackson default in
   * Spring Boot 2.6) — known QoL issue. {@code null} for always-open
   * venues (CRYPTO).
   */
  nextChangeAt: number | string | null;
}

/** Pseudo-exchange code used for 24/7 venues (crypto). */
export const CRYPTO_EXCHANGE_CODE = 'CRYPTO';
