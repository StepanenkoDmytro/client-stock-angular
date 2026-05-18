import { AssetClass } from './asset-class.domain';

/**
 * Live price quote keyed by instrument id. Produced by
 * `LivePriceService` from the backend polling endpoint
 * `GET /api/v1/prices/batch` (ADR-0003 / M4.5 / PR-A2).
 */
export interface PriceQuote {
  instrumentId: string;
  symbol: string;
  price: number;
  currency: string;
  assetClass: AssetClass;
  /**
   * Wall-clock time the value was captured by the backend. Stored as the
   * raw wire value (epoch-seconds-with-nanos float right now, ISO-8601
   * string after the backend Jackson upgrade — known QoL issue from
   * PR8a §5). Not currently rendered.
   */
  capturedAt: number | string;
  /**
   * `true` when the backend served a cached value because the upstream
   * provider was unreachable. UI may render a subtle hint.
   */
  stale: boolean;
}

/** Direction of last price change relative to the previous poll. */
export type PriceDirection = 'up' | 'down';
