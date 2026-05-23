import { IAccountV2 } from '../../../domain/account-v2.domain';

/**
 * Demo-mode account fixtures matching the holding seed in
 * `core/data/demo-fixtures.ts` (`DEMO_HOLDING_SPECS`) — same {@code id}
 * strings appear on `IHolding.accountId`. Materialised into the store by
 * `DemoDataService.seed()` when the user opts in to demo data (wrapped
 * by `buildDemoAccountsWithFlag()` so each row carries `isDemo: true`).
 * Production builds NEVER consume this list — the backend is the source
 * of truth there, and `seedManualAccount` ships a single MANUAL row on
 * first signup instead.
 *
 * <p>Mix chosen to cover all five {@link AccountTypeV2} buckets PLUS at
 * least one STALE row so the header chip's notification badge and the
 * Stats Task 1 widgets have something interesting to render out of the box.
 *
 * <p>Timestamps are computed at module-load time (deliberate trade-off:
 * "edited 2h ago" stays evergreen across dev sessions; downside: tests
 * that want stable copy must mock the clock). Fine for demo-only data.
 */
export function buildDemoAccounts(): IAccountV2[] {
  const now = Date.now();
  const minutesAgo = (m: number) => new Date(now - m * 60_000).toISOString();
  const hoursAgo = (h: number) => new Date(now - h * 3_600_000).toISOString();
  const daysAgo = (d: number) => new Date(now - d * 86_400_000).toISOString();

  return [
    {
      id: 'acc-ibkr',
      accountNumber: 'Interactive Brokers',
      accountType: 'BROKERAGE',
      provider: 'IBKR',
      currency: 'USD',
      syncStatus: 'OK',
      lastSyncedAt: hoursAgo(2),
    },
    {
      id: 'acc-robinhood',
      accountNumber: 'Robinhood',
      accountType: 'BROKERAGE',
      provider: 'SCHWAB',
      currency: 'USD',
      syncStatus: 'OK',
      lastSyncedAt: minutesAgo(18),
    },
    {
      id: 'acc-bybit-spot',
      accountNumber: 'Bybit Spot',
      accountType: 'EXCHANGE',
      provider: 'BYBIT',
      currency: 'USD',
      syncStatus: 'OK',
      lastSyncedAt: minutesAgo(45),
    },
    {
      id: 'acc-bybit-earn',
      accountNumber: 'Bybit Earn',
      accountType: 'EXCHANGE',
      provider: 'BYBIT',
      currency: 'USD',
      syncStatus: 'OK',
      lastSyncedAt: minutesAgo(18),
    },
    {
      id: 'acc-trezor',
      accountNumber: 'Cold wallet (Trezor)',
      accountType: 'WALLET',
      // No provider — cold wallet is manual entry only.
      currency: 'USD',
      syncStatus: 'NEVER',
    },
    {
      // Deliberately STALE so the notification badge on
      // <pgz-accounts-chip> and W2 status indicators have something to show.
      id: 'acc-monobank',
      accountNumber: 'Monobank',
      accountType: 'BANK',
      provider: 'MONO',
      currency: 'UAH',
      syncStatus: 'STALE',
      lastSyncedAt: daysAgo(3),
    },
    {
      id: 'manual',
      accountNumber: 'Manual',
      accountType: 'MANUAL',
      currency: 'USD',
    },
  ];
}
