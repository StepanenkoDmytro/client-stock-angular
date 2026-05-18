import { AccountKind } from '../../../../../domain/account-kind.domain';

/**
 * Account choice surfaced in the Add Holding form's Account picker.
 * Account CRUD UI is out of scope for PR5b (§7 of the task) — the user
 * picks from a fixed set that matches the demo-seed accounts, plus a
 * default Manual bucket. Real Account entity / store lands later.
 */
export interface AccountChoice {
  id: string;
  name: string;
  kind: AccountKind;
}

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
