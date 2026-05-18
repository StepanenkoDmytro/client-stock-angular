import { AssetClass } from './asset-class.domain';

/**
 * InstrumentMetadata — discriminated union of class-specific metadata.
 *
 * Mirrors the Java sealed interface planned for the backend in M2 PR1
 * (docs/notes/2026-05-m2-plan.md). Discriminator field is `kind: AssetClass`
 * so TypeScript narrows each variant via type guards from
 * `pages/savings/model/InstrumentMetadata.ts`.
 *
 * The shape of each variant is the minimum we need on the frontend; the
 * backend will carry the same fields plus persistence-only ones (e.g. ISIN
 * for stocks, contract address for tokenized stocks).
 */
export type InstrumentMetadata =
  | StockMetadata
  | EtfMetadata
  | TokenizedStockMetadata
  | CryptoMetadata
  | CashMetadata
  | DepositMetadata
  | RealEstateMetadata
  | OtherMetadata;

export interface StockMetadata {
  kind: AssetClass.STOCK;
  exchange: string;
  currency: string;
  country?: string;
  sector?: string;
  industry?: string;
  dividendYield?: number;
  /** ISIN if available — Alpha Vantage SYMBOL_SEARCH does not return it; comes from OVERVIEW only. */
  isin?: string;
}

/**
 * Exchange-traded fund metadata. Mirrors the backend `EtfMetadata` record
 * (PR8a done report §1). Behaviourally close to STOCK, but with fund-level
 * disclosures (expense ratio, AUM, fund family).
 */
export interface EtfMetadata {
  kind: AssetClass.ETF;
  exchange: string;
  currency: string;
  country?: string;
  fundFamily?: string;
  /** Annual expense ratio as a fraction (0.0003 = 0.03%). */
  expenseRatio?: number;
  /** Net assets under management, in the fund's reporting currency. */
  netAssets?: number;
  dividendYield?: number;
  isin?: string;
}

export interface TokenizedStockMetadata {
  kind: AssetClass.TOKENIZED_STOCK;
  underlyingSymbol: string;
  tokenSymbol: string;
  exchange: string;
  blockchain: string;
}

export interface CryptoMetadata {
  kind: AssetClass.CRYPTO;
  coinId: string;
  blockchain?: string;
}

export interface CashMetadata {
  kind: AssetClass.CASH;
  currency: string;
}

export interface DepositMetadata {
  kind: AssetClass.DEPOSIT;
  currency: string;
  interestRate: number;
  /** ISO-8601 date, e.g. '2027-12-31'. */
  maturityDate?: string;
}

export type RealEstatePropertyType =
  | 'APARTMENT'
  | 'HOUSE'
  | 'LAND'
  | 'COMMERCIAL'
  | 'OTHER';

export interface RealEstateMetadata {
  kind: AssetClass.REAL_ESTATE;
  currency: string;
  country?: string;
  propertyType?: RealEstatePropertyType;
}

export interface OtherMetadata {
  kind: AssetClass.OTHER;
  currency: string;
  customFields?: Record<string, string>;
}

/**
 * IInstrument — market-level definition of a tradable item.
 *
 * `createdBy: 'system'` for global instruments seeded from market feeds
 * (stocks, crypto). `createdBy: 'user'` for custom instruments the user
 * created via the "Create custom instrument" inline form. The backend
 * equivalent is the `created_by` UUID column (null for system) — we map
 * to 'system'/'user' on the client until M5 ties userId in.
 */
export interface IInstrument {
  id: string;
  assetClass: AssetClass;
  symbol: string;
  name: string;
  /** Pricing currency, ISO 4217 (e.g. 'USD', 'UAH'). Often equals `metadata.currency`. */
  currency: string;
  metadata: InstrumentMetadata;
  createdBy: 'system' | 'user';
  /** ISO-8601 timestamp. */
  createdAt: string;
}
