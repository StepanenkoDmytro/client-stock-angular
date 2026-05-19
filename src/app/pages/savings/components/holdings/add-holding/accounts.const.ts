import { AccountKind } from '../../../../../domain/account-kind.domain';
import {
  AccountTypeV2,
  IAccountV2,
  accountDisplayName,
} from '../../../../../domain/account-v2.domain';

/**
 * Account choice surfaced in the Add Holding form's Account picker.
 * Populated at runtime from {@code AccountsService.getAll()} via
 * {@link toAccountChoice}; the seed array {@link ADD_HOLDING_ACCOUNTS}
 * below is kept for demo mode only.
 */
export interface AccountChoice {
  id: string;
  name: string;
  kind: AccountKind;
}

/**
 * Demo-mode account list. Real beta runs read from the backend via
 * {@code AccountsService}; this list ships pre-populated buckets so
 * screenshot / story sessions stay self-contained.
 */
export const ADD_HOLDING_ACCOUNTS: ReadonlyArray<AccountChoice> = [
  { id: 'manual',          name: 'Manual',                  kind: 'MANUAL' },
  { id: 'acc-ibkr',        name: 'Interactive Brokers',     kind: 'BROKERAGE_CASH' },
  { id: 'acc-robinhood',   name: 'Robinhood',               kind: 'BROKERAGE_CASH' },
  { id: 'acc-bybit-spot',  name: 'Bybit Spot',              kind: 'EXCHANGE_SPOT' },
  { id: 'acc-bybit-earn',  name: 'Bybit Earn',              kind: 'EXCHANGE_EARN' },
  { id: 'acc-trezor',      name: 'Cold wallet (Trezor)',    kind: 'WALLET_COLD' },
  { id: 'acc-monobank',    name: 'Monobank',                kind: 'BANK_SAVINGS' },
];

/**
 * Coarse-grained backend {@link AccountTypeV2} → finer-grained UI
 * {@link AccountKind} mapping. Backend has 5 types, UI has 11 kinds.
 * Default picks the most common variant per type — sufficient for the
 * 5-tester beta. The user-curated fine-grained kind lands in M6 when
 * the backend column gains the subtype.
 *
 * <ul>
 *   <li>BROKERAGE → BROKERAGE_CASH (vs MARGIN)</li>
 *   <li>EXCHANGE → EXCHANGE_SPOT (vs EARN / FUTURES)</li>
 *   <li>BANK → BANK_SAVINGS (vs CURRENT / DEPOSIT — SAVINGS surfaces
 *       Earn block by default since most testers have APR-bearing accounts)</li>
 *   <li>WALLET → WALLET_HOT (vs COLD — beta assumes hot is more common)</li>
 *   <li>MANUAL → MANUAL</li>
 * </ul>
 */
export function defaultKindFor(type: AccountTypeV2): AccountKind {
  switch (type) {
    case 'BROKERAGE': return 'BROKERAGE_CASH';
    case 'EXCHANGE':  return 'EXCHANGE_SPOT';
    case 'BANK':      return 'BANK_SAVINGS';
    case 'WALLET':    return 'WALLET_HOT';
    case 'MANUAL':    return 'MANUAL';
  }
}

/**
 * Map a backend-shaped account row to the picker's choice shape.
 * The numeric DB id is kept as-is (stringified by the store layer);
 * {@code HoldingService.toCreateRequest} parses it back with
 * {@code Number()} before forwarding to the server.
 */
export function toAccountChoice(a: IAccountV2): AccountChoice {
  return {
    id: a.id,
    name: accountDisplayName(a),
    kind: defaultKindFor(a.accountType),
  };
}

/**
 * Account kinds that surface the EARN block (APR + optional lock period).
 * Per ADR-0001 §`Holding.lockMeta` — earn data is account-driven, not
 * class-driven, so a CRYPTO position on a regular spot wallet has no
 * earn block but the same CRYPTO on Bybit Earn does.
 */
export const EARN_ACCOUNT_KINDS: ReadonlySet<AccountKind> = new Set<AccountKind>([
  'EXCHANGE_EARN',
  'BANK_DEPOSIT',
  'BANK_SAVINGS',
]);
