import { AssetClass } from '../../../domain/asset-class.domain';
import {
  CashMetadata,
  CryptoMetadata,
  DepositMetadata,
  InstrumentMetadata,
  OtherMetadata,
  RealEstateMetadata,
  StockMetadata,
  TokenizedStockMetadata,
} from '../../../domain/instrument.domain';

/**
 * Type guards for InstrumentMetadata discriminated union.
 *
 * Use these in templates and selectors when you need to access class-specific
 * fields without `any` casts:
 *
 *   if (isStockMetadata(instrument.metadata)) {
 *     // metadata.exchange is now typed as string
 *   }
 */

export function isStockMetadata(m: InstrumentMetadata): m is StockMetadata {
  return m.kind === AssetClass.STOCK;
}

export function isTokenizedStockMetadata(
  m: InstrumentMetadata,
): m is TokenizedStockMetadata {
  return m.kind === AssetClass.TOKENIZED_STOCK;
}

export function isCryptoMetadata(m: InstrumentMetadata): m is CryptoMetadata {
  return m.kind === AssetClass.CRYPTO;
}

export function isCashMetadata(m: InstrumentMetadata): m is CashMetadata {
  return m.kind === AssetClass.CASH;
}

export function isDepositMetadata(m: InstrumentMetadata): m is DepositMetadata {
  return m.kind === AssetClass.DEPOSIT;
}

export function isRealEstateMetadata(
  m: InstrumentMetadata,
): m is RealEstateMetadata {
  return m.kind === AssetClass.REAL_ESTATE;
}

export function isOtherMetadata(m: InstrumentMetadata): m is OtherMetadata {
  return m.kind === AssetClass.OTHER;
}

/**
 * Returns a minimally-populated InstrumentMetadata for the given AssetClass.
 * Used by the Create Custom Instrument form to bootstrap form defaults so the
 * union is always well-typed regardless of which class the user picks.
 *
 * `currency` defaults to USD; the form should override with the user's base
 * currency once `UserPreferences.baseCurrency` (M3) lands.
 */
export function defaultMetadataFor(
  assetClass: AssetClass,
  currency: string = 'USD',
): InstrumentMetadata {
  switch (assetClass) {
    case AssetClass.STOCK:
      return { kind: AssetClass.STOCK, exchange: '', currency };
    case AssetClass.TOKENIZED_STOCK:
      return {
        kind: AssetClass.TOKENIZED_STOCK,
        underlyingSymbol: '',
        tokenSymbol: '',
        exchange: '',
        blockchain: '',
      };
    case AssetClass.CRYPTO:
      return { kind: AssetClass.CRYPTO, coinId: '' };
    case AssetClass.CASH:
      return { kind: AssetClass.CASH, currency };
    case AssetClass.DEPOSIT:
      return { kind: AssetClass.DEPOSIT, currency, interestRate: 0 };
    case AssetClass.REAL_ESTATE:
      return { kind: AssetClass.REAL_ESTATE, currency };
    case AssetClass.OTHER:
      return { kind: AssetClass.OTHER, currency };
  }
}
