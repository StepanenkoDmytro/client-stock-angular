/**
 * AccountKind — discriminator describing what *kind* of place a holding
 * lives in: a brokerage cash account, a crypto exchange spot wallet, a
 * cold-storage hardware wallet, a term bank deposit, etc.
 *
 * The same Instrument can sit on several AccountKinds at once (e.g. BTC on
 * `WALLET_COLD` + `EXCHANGE_EARN` + `EXCHANGE_SPOT`). PositionsService
 * aggregates totals across them but per-row UI flags (icon / chip) are
 * driven by this discriminator.
 *
 * Mirrors the Java enum planned for the backend in M2 (Account.kind
 * column). Until M2 lands, this is populated by the frontend mock-seed
 * (HoldingService) directly into the optional `IHolding.accountKind`
 * field; when backend goes live, HoldingMapper fills the field from API
 * responses and the mock-seed is dropped.
 *
 * Per ADR-0001 §`Account.kind`.
 */
export type AccountKind =
  | 'BROKERAGE_CASH'
  | 'BROKERAGE_MARGIN'
  | 'EXCHANGE_SPOT'
  | 'EXCHANGE_EARN'
  | 'EXCHANGE_FUTURES'
  | 'WALLET_HOT'
  | 'WALLET_COLD'
  | 'BANK_DEPOSIT'
  | 'BANK_SAVINGS'
  | 'BANK_CURRENT'
  | 'MANUAL';

/** Full list of AccountKind values, canonical iteration order. */
export const ACCOUNT_KINDS: readonly AccountKind[] = [
  'BROKERAGE_CASH',
  'BROKERAGE_MARGIN',
  'EXCHANGE_SPOT',
  'EXCHANGE_EARN',
  'EXCHANGE_FUTURES',
  'WALLET_HOT',
  'WALLET_COLD',
  'BANK_DEPOSIT',
  'BANK_SAVINGS',
  'BANK_CURRENT',
  'MANUAL',
] as const;
