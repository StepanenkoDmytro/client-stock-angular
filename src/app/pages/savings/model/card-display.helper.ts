import { AssetClass } from '../../../domain/asset-class.domain';
import { IHoldingView } from '../../../domain/holding.domain';
import { IPosition } from '../../../domain/position.domain';

/** Minimal "current price for symbol" lookup — same shape as `PositionsService.PriceFor`. */
export type PriceLookup = (symbol: string) => number | undefined;

/**
 * Right-column second line under the value cell of `pgz-position-card`.
 * Empty string when no second line should render.
 *
 * <p>{@code currentPrice} comes from {@link PriceLookup} — the call site
 * passes `HoldingService.getCurrentPrice` which since PR-A4 delegates to
 * `LivePriceService` (30s polling) with mock fallback. No new HTTP plumbing.
 *
 * <p>Per-class output:
 * <ul>
 *   <li>STOCK / ETF / TOKENIZED_STOCK → "{qty} sh × ${currentPrice}"</li>
 *   <li>CRYPTO → "{qty} {symbol} × ${currentPrice}"</li>
 *   <li>CASH → "≈ {currencySymbol}{amount}"</li>
 *   <li>DEPOSIT → "matures {Mon YYYY}" for TERM_DEPOSIT, else ""</li>
 *   <li>REAL_ESTATE / OTHER → "" (no second line)</li>
 * </ul>
 */
export function rightColumnSecondLineFor(
  pos: IPosition,
  priceFor: PriceLookup,
): string {
  const inst = pos.instrument;
  if (!inst) {
    return '';
  }

  switch (inst.assetClass) {
    case AssetClass.STOCK:
    case AssetClass.ETF:
    case AssetClass.TOKENIZED_STOCK: {
      // Per-unit market price stays in the instrument's native quote
      // currency (an asset trades in one currency); only aggregate values
      // are FX-normalised to baseCurrency elsewhere.
      const price = priceFor(inst.symbol) ?? pos.weightedAvgPrice;
      return `${formatShares(pos.totalQuantity)} sh × ${currencySymbolOf(inst.currency)}${formatMoney(price, 2)}`;
    }
    case AssetClass.CRYPTO: {
      const price = priceFor(inst.symbol) ?? pos.weightedAvgPrice;
      return `${formatCrypto(pos.totalQuantity)} ${inst.symbol} × ${currencySymbolOf(inst.currency)}${formatMoney(price, 0)}`;
    }
    case AssetClass.CASH: {
      const symbol = currencySymbolOf(inst.currency);
      return `≈ ${symbol}${formatMoney(pos.totalQuantity, 0)}`;
    }
    case AssetClass.DEPOSIT: {
      const meta = pos.holdings[0]?.lockMeta;
      if (meta?.kind === 'TERM_DEPOSIT' && meta.maturityDate) {
        const d = new Date(meta.maturityDate);
        if (!Number.isNaN(d.getTime())) {
          const ym = d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
          });
          return `matures ${ym}`;
        }
      }
      return '';
    }
    case AssetClass.REAL_ESTATE:
    case AssetClass.OTHER:
      return '';
  }
}

/**
 * Subline (row-2 left under symbol) — simplified to name + a class-specific
 * suffix. Replaces the old per-class subline logic inside
 * `pgz-position-card`.
 *
 * <p>Per-class output:
 * <ul>
 *   <li>STOCK / ETF / TOKENIZED_STOCK / CRYPTO / CASH single → "{instrument.name}"</li>
 *   <li>multi-holding (any of the above) → "{name} · across N locations"</li>
 *   <li>DEPOSIT → "{name}"</li>
 *   <li>REAL_ESTATE single → "{name} · owned {period}"; multi → "{name} · across N locations"</li>
 *   <li>OTHER → "{name} · Manual entry"</li>
 *
 * <p>Account name no longer appears in the subline — the
 * `<pgz-account-link-chip>` rendered under the subline carries that
 * info with an icon and (eventually) a click target.</li>
 * </ul>
 */
export function sublineFor(pos: IPosition): string {
  const inst = pos.instrument;
  if (!inst) {
    return '';
  }
  const isMulti = pos.holdings.length > 1;

  switch (inst.assetClass) {
    case AssetClass.STOCK:
    case AssetClass.ETF:
    case AssetClass.TOKENIZED_STOCK:
    case AssetClass.CRYPTO:
    case AssetClass.CASH:
      return isMulti
        ? `${inst.name} · across ${pos.holdings.length} locations`
        : inst.name;

    case AssetClass.DEPOSIT:
      return inst.name;

    case AssetClass.REAL_ESTATE: {
      if (isMulti) {
        return `${inst.name} · across ${pos.holdings.length} locations`;
      }
      const period = ownedPeriod(pos.holdings);
      return period ? `${inst.name} · owned ${period}` : inst.name;
    }

    case AssetClass.OTHER:
      return `${inst.name} · Manual entry`;
  }
}

// ---- Internal helpers (no re-export — kept private to keep API surface tight) ----

function formatShares(qty: number): string {
  if (Number.isInteger(qty)) {
    return qty.toLocaleString('en-US');
  }
  return qty.toLocaleString('en-US', { maximumFractionDigits: 4 });
}

function formatCrypto(qty: number): string {
  return qty.toLocaleString('en-US', { maximumFractionDigits: 8 });
}

function formatMoney(value: number, fractionDigits: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

/**
 * Minimal currency-code → glyph map. Anything not listed renders the
 * raw code as a fallback (e.g. "CHF1,000"). Pre-M3 placeholder until
 * FxRateService and a richer currency catalog land.
 */
function currencySymbolOf(currency: string | undefined): string {
  if (!currency) {
    return '$';
  }
  switch (currency.toUpperCase()) {
    case 'USD':
    case 'CAD':
    case 'AUD':
      return '$';
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    case 'JPY':
      return '¥';
    case 'UAH':
      return '₴';
    case 'PLN':
      return 'zł';
    default:
      return currency.toUpperCase();
  }
}

function ownedPeriod(holdings: ReadonlyArray<IHoldingView>): string | null {
  if (holdings.length === 0) {
    return null;
  }
  const oldestMs = holdings.reduce((min, h) => {
    const t = Date.parse(h.openedAt ?? h.createdAt);
    return Number.isFinite(t) && t < min ? t : min;
  }, Date.now());
  const days = Math.floor((Date.now() - oldestMs) / (1000 * 60 * 60 * 24));
  if (days < 1) {
    return null;
  }
  if (days < 30) {
    return `${days}d`;
  }
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months}m`;
  }
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years}y ${rem}m` : `${years}y`;
}
