/**
 * IAccountV2 — user's physical account where holdings live (IBKR brokerage,
 * Bybit exchange, Mono bank, Trezor wallet, etc.). Mirror of the backend
 * `AccountV2Dto` returned by `/api/v1/accounts`.
 *
 * <p>Coarse-grained kind (`accountType`) maps 1:1 to the backend enum;
 * the finer-grained UI `AccountKind` (BROKERAGE_CASH / EXCHANGE_EARN / ...)
 * is a separate concern owned by holding-row rendering (`account-kind.const.ts`).
 *
 * <p>The label rendered in pickers and Position cards is `accountNumber`
 * when the user provided one, otherwise a derived "{provider} {type}"
 * fallback (e.g. "IBKR brokerage", "Bybit exchange") so the UI never
 * shows a blank row.
 */
export type AccountTypeV2 = 'MANUAL' | 'BROKERAGE' | 'EXCHANGE' | 'BANK' | 'WALLET';

export type SyncStatus = 'OK' | 'STALE' | 'ERROR' | 'NEVER';

export interface IAccountV2 {
  id: string;
  /**
   * Display label: external account number / iban / wallet address. Optional —
   * `MANUAL` accounts often skip it. UI falls back to "{provider} {type}".
   */
  accountNumber?: string;
  accountType: AccountTypeV2;
  /** Vendor short id ("IBKR", "BINANCE", "BYBIT", "MONO"). Null for MANUAL. */
  provider?: string;
  /** ISO-8601 timestamp of last successful sync; null for MANUAL/NEVER. */
  lastSyncedAt?: string;
  syncStatus?: SyncStatus;
  /** ISO 4217 ("USD", "UAH", "EUR"). */
  currency?: string;
}

/**
 * Human-readable label for the picker / position card. Prefers
 * `accountNumber`, falls back to "{provider} {type}" or just the type.
 */
export function accountDisplayName(a: IAccountV2): string {
  if (a.accountNumber && a.accountNumber.trim().length > 0) {
    return a.accountNumber;
  }
  if (a.provider) {
    return `${a.provider} ${a.accountType.toLowerCase()}`;
  }
  // MANUAL with no provider — render lowercase for a soft chip look.
  return a.accountType === 'MANUAL' ? 'Manual' : a.accountType.toLowerCase();
}
