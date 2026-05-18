/**
 * AssetClass — top-level taxonomy of instruments per ADR-0001.
 *
 * Mirrors the Java enum planned for the backend in M2 PR1
 * (docs/notes/2026-05-m2-plan.md). String values must match the backend
 * exactly so we can serialize without translation when REST sync lands in M5.
 */
export enum AssetClass {
  STOCK = 'STOCK',
  ETF = 'ETF',
  TOKENIZED_STOCK = 'TOKENIZED_STOCK',
  CRYPTO = 'CRYPTO',
  CASH = 'CASH',
  DEPOSIT = 'DEPOSIT',
  REAL_ESTATE = 'REAL_ESTATE',
  OTHER = 'OTHER',
}

/** All AssetClass values in canonical order for UI selects, iteration, etc. */
export const ASSET_CLASSES: readonly AssetClass[] = [
  AssetClass.STOCK,
  AssetClass.ETF,
  AssetClass.TOKENIZED_STOCK,
  AssetClass.CRYPTO,
  AssetClass.CASH,
  AssetClass.DEPOSIT,
  AssetClass.REAL_ESTATE,
  AssetClass.OTHER,
] as const;

/**
 * Global-scope classes: instrument is shared across all users (e.g. AAPL stock,
 * BTC crypto). Created from market feeds. On the backend these have
 * `created_by IS NULL` per M2 PR2 plan.
 */
export const GLOBAL_ASSET_CLASSES: ReadonlySet<AssetClass> = new Set([
  AssetClass.STOCK,
  AssetClass.ETF,
  AssetClass.TOKENIZED_STOCK,
  AssetClass.CRYPTO,
  AssetClass.CASH,
]);

/**
 * Classes that have a market-data feed behind them (Alpha Vantage / CoinGecko
 * — bekend PR8). The UI autocomplete switches into "market" HTTP mode for
 * these; manual classes stay on local sync search + inline create.
 *
 * Keep in sync with backend `MarketSearchProvider.supportedClasses()`.
 */
export const MARKET_BACKED_ASSET_CLASSES: ReadonlySet<AssetClass> = new Set([
  AssetClass.STOCK,
  AssetClass.ETF,
  AssetClass.TOKENIZED_STOCK,
  AssetClass.CRYPTO,
]);

export function isMarketBackedAssetClass(assetClass: AssetClass): boolean {
  return MARKET_BACKED_ASSET_CLASSES.has(assetClass);
}

/**
 * Per-user-scope classes: instrument is private to its creator (a specific
 * deposit, apartment, custom item). On the backend these have
 * `created_by = userId NOT NULL`.
 */
export const PER_USER_ASSET_CLASSES: ReadonlySet<AssetClass> = new Set([
  AssetClass.DEPOSIT,
  AssetClass.REAL_ESTATE,
  AssetClass.OTHER,
]);

export function isGlobalAssetClass(assetClass: AssetClass): boolean {
  return GLOBAL_ASSET_CLASSES.has(assetClass);
}

export function isPerUserAssetClass(assetClass: AssetClass): boolean {
  return PER_USER_ASSET_CLASSES.has(assetClass);
}
