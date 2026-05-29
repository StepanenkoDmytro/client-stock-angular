import { AccountKind } from '../../domain/account-kind.domain';
import { IAccountV2 } from '../../domain/account-v2.domain';
import { AssetClass } from '../../domain/asset-class.domain';
import { IGoal } from '../../domain/goals.domain';
import { IHoldingLockMeta } from '../../domain/holding.domain';
import { IInstrument } from '../../domain/instrument.domain';
import { ILiability } from '../../domain/liability.domain';
import { ITag } from '../../domain/tag.domain';
import { MANUAL_ACCOUNT_ID } from '../../pages/savings/model/HoldingMapper';
import { buildDemoAccounts } from '../../pages/savings/model/account-defaults.constants';
import { createSystemTags } from '../../pages/savings/model/system-tags.constants';

/**
 * Pure-data fixtures consumed by `DemoDataService.seed()` per
 * `docs/notes/2026-05-savings-empty-states-ladder.md` §6 PR1.
 *
 * <p>Lives in `core/data/` so the materialising service (`core/services/
 * demo-data.service.ts`) can compose holdings + accounts + system tags from
 * a single source of truth. The per-feature factories under
 * `pages/savings/model/` (`account-defaults.constants.ts`,
 * `system-tags.constants.ts`) stay where they are — this module wraps them
 * with the `isDemo: true` stamp the lifecycle needs.
 *
 * <p>Nothing here triggers automatically — the only auto-seed paths on
 * `HoldingService` / `AccountsService` / `TagsService` were removed in the
 * same PR. Demo data now lands in the stores only when the user opts in
 * via «Try with demo data» (PR3) or «Restore demo» (PR5 Profile).
 */

/**
 * Spec for a demo-mode instrument. Market-backed classes (STOCK / ETF /
 * CRYPTO / TOKENIZED_STOCK) are resolved through
 * `InstrumentService.searchMarket()` so the resulting id matches the
 * backend catalog and live polling returns real Alpha Vantage /
 * CoinGecko quotes (live-prices doc §2). Manual classes (CASH / DEPOSIT
 * / REAL_ESTATE / OTHER) and any resolution failure (server offline,
 * quota exhausted, no exact-symbol match) fall back to
 * `InstrumentService.getOrCreate` with a client UUID — those holdings
 * use {@link DEMO_FALLBACK_PRICES} for display.
 */
export interface DemoInstrumentSpec {
  symbol: string;
  assetClass: AssetClass;
  name: string;
  currency: string;
  metadata: IInstrument['metadata'];
}

/**
 * Spec for a demo holding row. Account ids match the literals in
 * {@link buildDemoAccounts} so the join holdings × accounts (Stats Task 1,
 * Position-card multi-location subline) renders correctly out of the box.
 */
export interface DemoHoldingSpec {
  symbol: string;
  accountId: string;
  accountName: string;
  accountKind: AccountKind;
  quantity: number;
  avgBuyPrice: number;
  tags: string[];
  lockMeta?: IHoldingLockMeta;
  openedAt?: string;
}

/**
 * Six instrument fixtures spanning the AssetClass enum, hand-crafted to
 * exercise the Position-card aggregation path: BTC at 3 accounts, AAPL
 * at 2 brokers, MSFT / USD / KYIV-APT-1 single-location, plus AAPL.X
 * (tokenised) in its own class group.
 */
export const DEMO_INSTRUMENT_SPECS: DemoInstrumentSpec[] = [
  {
    symbol: 'AAPL',
    assetClass: AssetClass.STOCK,
    name: 'Apple Inc.',
    currency: 'USD',
    metadata: {
      kind: AssetClass.STOCK,
      exchange: 'NASDAQ',
      currency: 'USD',
      country: 'US',
      sector: 'Technology',
      industry: 'Consumer Electronics',
      dividendYield: 0.005,
    },
  },
  {
    symbol: 'AAPL.X',
    assetClass: AssetClass.TOKENIZED_STOCK,
    name: 'Apple Inc. (tokenised)',
    currency: 'USD',
    metadata: {
      kind: AssetClass.TOKENIZED_STOCK,
      underlyingSymbol: 'AAPL',
      tokenSymbol: 'AAPL.X',
      exchange: 'Bybit',
      blockchain: 'Ethereum',
    },
  },
  {
    symbol: 'MSFT',
    assetClass: AssetClass.STOCK,
    name: 'Microsoft Corp.',
    currency: 'USD',
    metadata: {
      kind: AssetClass.STOCK,
      exchange: 'NASDAQ',
      currency: 'USD',
      country: 'US',
      sector: 'Technology',
      industry: 'Software',
      dividendYield: 0.008,
    },
  },
  {
    symbol: 'BTC',
    assetClass: AssetClass.CRYPTO,
    name: 'Bitcoin',
    currency: 'USD',
    metadata: { kind: AssetClass.CRYPTO, coinId: 'bitcoin' },
  },
  {
    // Stablecoin — gives the Crypto class a Low-tier slice so the
    // Volatility profile renders the "Mixed" split (analytics §08).
    symbol: 'USDT',
    assetClass: AssetClass.CRYPTO,
    name: 'Tether USD',
    currency: 'USD',
    metadata: { kind: AssetClass.CRYPTO, coinId: 'tether' },
  },
  {
    symbol: 'USD',
    assetClass: AssetClass.CASH,
    name: 'USD Cash',
    currency: 'USD',
    metadata: { kind: AssetClass.CASH, currency: 'USD' },
  },
  {
    // Native-UAH cash — exercises FX normalisation + currency exposure
    // (multi-currency analytics). Held at Monobank in ₴.
    symbol: 'UAH',
    assetClass: AssetClass.CASH,
    name: 'UAH Cash',
    currency: 'UAH',
    metadata: { kind: AssetClass.CASH, currency: 'UAH' },
  },
  {
    symbol: 'KYIV-APT-1',
    assetClass: AssetClass.REAL_ESTATE,
    name: 'Apartment in Kyiv',
    currency: 'USD',
    metadata: {
      kind: AssetClass.REAL_ESTATE,
      currency: 'USD',
      country: 'UA',
      propertyType: 'APARTMENT',
    },
  },
];

/** 9 demo holdings; see {@link DEMO_INSTRUMENT_SPECS} for the rationale. */
export const DEMO_HOLDING_SPECS: DemoHoldingSpec[] = [
  {
    symbol: 'AAPL',
    accountId: 'acc-ibkr',
    accountName: 'Interactive Brokers',
    accountKind: 'BROKERAGE_CASH',
    quantity: 12,
    avgBuyPrice: 152.4,
    tags: ['Long-term', 'Dividend', 'Pension'],
  },
  {
    symbol: 'AAPL',
    accountId: 'acc-robinhood',
    accountName: 'Robinhood',
    accountKind: 'BROKERAGE_CASH',
    quantity: 5,
    avgBuyPrice: 168.1,
    tags: ['Short-term', 'Trading'],
  },
  {
    symbol: 'AAPL.X',
    accountId: 'acc-bybit-spot',
    accountName: 'Bybit Spot',
    accountKind: 'EXCHANGE_SPOT',
    quantity: 8,
    avgBuyPrice: 170.0,
    tags: ['Speculative', 'Trading'],
  },
  {
    symbol: 'MSFT',
    accountId: 'acc-ibkr',
    accountName: 'Interactive Brokers',
    accountKind: 'BROKERAGE_CASH',
    quantity: 8,
    avgBuyPrice: 310,
    tags: ['Long-term', 'Growth', 'Pension'],
  },
  {
    symbol: 'BTC',
    accountId: 'acc-trezor',
    accountName: 'Cold wallet (Trezor)',
    accountKind: 'WALLET_COLD',
    quantity: 0.15,
    avgBuyPrice: 38000,
    openedAt: '2024-01-15T00:00:00.000Z',
    tags: ['Long-term', 'Pension'],
  },
  {
    symbol: 'BTC',
    accountId: 'acc-bybit-earn',
    accountName: 'Bybit Earn',
    accountKind: 'EXCHANGE_EARN',
    quantity: 0.12,
    avgBuyPrice: 42500,
    lockMeta: {
      kind: 'STAKING',
      apr: 5,
      lockEndDate: '2026-06-04T00:00:00.000Z',
      lockPeriod: '30-day lock',
    },
    tags: ['Speculative', 'Growth'],
  },
  {
    symbol: 'BTC',
    accountId: 'acc-bybit-spot',
    accountName: 'Bybit Spot',
    accountKind: 'EXCHANGE_SPOT',
    quantity: 0.05,
    avgBuyPrice: 45300,
    tags: ['Speculative', 'Trading'],
  },
  {
    // Stablecoin on Bybit Earn → Crypto class gets a Low-tier slice
    // (Mixed volatility) + adds to the exchange side of custody mix.
    symbol: 'USDT',
    accountId: 'acc-bybit-earn',
    accountName: 'Bybit Earn',
    accountKind: 'EXCHANGE_EARN',
    quantity: 4000,
    avgBuyPrice: 1,
    tags: ['Fixed income'],
  },
  {
    symbol: 'USD',
    accountId: 'acc-monobank',
    accountName: 'Monobank',
    accountKind: 'BANK_SAVINGS',
    quantity: 9895,
    avgBuyPrice: 1,
    tags: ['Emergency', 'Fixed income'],
  },
  {
    // Native-UAH cash → currency exposure + FX normalisation in aggregates.
    symbol: 'UAH',
    accountId: 'acc-monobank',
    accountName: 'Monobank',
    accountKind: 'BANK_SAVINGS',
    quantity: 50000,
    avgBuyPrice: 1,
    tags: ['Emergency'],
  },
  {
    symbol: 'USD',
    accountId: MANUAL_ACCOUNT_ID,
    accountName: 'Manual cash',
    accountKind: 'MANUAL',
    quantity: 1000,
    avgBuyPrice: 1,
    tags: ['Emergency'],
  },
  {
    symbol: 'KYIV-APT-1',
    accountId: MANUAL_ACCOUNT_ID,
    accountName: 'Manual',
    accountKind: 'MANUAL',
    quantity: 1,
    avgBuyPrice: 95000,
    tags: ['Long-term', 'Pension'],
  },
];

/**
 * Demo-mode-only price table consumed by `HoldingService.getCurrentPrice`
 * when {@link LivePriceService} has no value (typical for `npm start`
 * without `docker compose up stock-archive-server`). Mirrors the symbols
 * in {@link DEMO_INSTRUMENT_SPECS} with realistic current prices so the
 * dashboard reads plausibly while the user explores the demo offline.
 */
export const DEMO_FALLBACK_PRICES: Record<string, number> = {
  AAPL: 175.0,
  'AAPL.X': 176.0,
  MSFT: 410.0,
  BTC: 58000.0,
  USDT: 1.0,
  USD: 1.0,
  UAH: 1.0,
  'KYIV-APT-1': 110000.0,
};

/**
 * 7 account fixtures with the `isDemo: true` stamp baked in. Wraps the
 * existing {@link buildDemoAccounts} factory in `pages/savings/model/` so
 * the underlying definitions stay co-located with the AccountKind
 * domain but the demo lifecycle has a single materialiser to call.
 */
export function buildDemoAccountsWithFlag(): IAccountV2[] {
  return buildDemoAccounts().map((a) => ({ ...a, isDemo: true }));
}

/**
 * 12 system tags (3 roots + 9 leaves per ADR-0007) with the `isDemo: true`
 * stamp baked in. Per task §4.3, system tags belong to the demo bucket —
 * they seed alongside demo holdings and disappear on `clear()` together.
 * User-created tags (`system: false`, `isDemo: false`) survive a clear.
 */
export function createDemoSystemTags(): ITag[] {
  return createSystemTags().map((t) => ({ ...t, isDemo: true }));
}

/**
 * Demo liabilities (ADR-0009 · plan L4) — minimal set that lights up the
 * net-worth headline, the Liabilities band, and the debt-payoff goals:
 *  - one term mortgage (USD) and one term auto loan (USD) → debt-payoff
 *    goals with a freedom date on the projection;
 *  - one revolving credit card (native ₴) → utilisation, no goal.
 * High ids (9xxx) keep them out of the way of user-created ones; `isDemo`
 * lets {@link DemoDataService.clear} drop them.
 */
export function buildDemoLiabilities(): ILiability[] {
  return [
    {
      id: 9001,
      type: 'MORTGAGE',
      lender: 'Mortgage · Apt #1',
      principalBalance: 40000,
      originalAmount: 52000,
      currency: 'USD',
      interestRate: 7.2,
      rateType: 'FIXED',
      startDate: '2021-03-01',
      endDate: '2034-03-01',
      isDemo: true,
    },
    {
      id: 9002,
      type: 'AUTO_LOAN',
      lender: 'VW Golf',
      principalBalance: 8000,
      originalAmount: 15000,
      currency: 'USD',
      interestRate: 4.9,
      rateType: 'FIXED',
      startDate: '2023-06-01',
      endDate: '2028-06-01',
      isDemo: true,
    },
    {
      id: 9003,
      type: 'CREDIT_CARD',
      lender: 'Monobank',
      principalBalance: 45000,
      originalAmount: 180000,
      currency: 'UAH',
      interestRate: 0,
      rateType: 'VARIABLE',
      isDemo: true,
    },
  ];
}

/**
 * Demo goals — two active savings goals (one dated → ETA + projection
 * goal-line) plus one completed, archived goal so the Statistics → Goals
 * **Archived** group isn't empty out of the box (mockup analytics/16, the
 * /goals page was removed 2026-05-29). `share` on the active rows is a
 * fraction of the gross portfolio earmarked, so progress reads plausibly
 * against the demo holdings (~48% / ~100%).
 *
 * The archived row uses the legacy absolute-amount `share` convention
 * (`share === finishSum` ⇒ 100 %); it's excluded from the stats projection
 * (`archived`), so the fraction-vs-amount `share` ambiguity is moot here —
 * full unification of the `share` unit is tracked separately.
 */
export function buildDemoGoals(): IGoal[] {
  return [
    {
      id: 9001,
      name: 'Apartment Kyiv',
      finishSum: 60000,
      share: 0.18,
      status: 'active',
      approximateDate: new Date('2029-02-01'),
      isDemo: true,
    },
    {
      id: 9002,
      name: 'Emergency fund',
      finishSum: 6000,
      share: 0.05,
      status: 'active',
      isDemo: true,
    },
    {
      id: 9003,
      name: 'New MacBook',
      finishSum: 2500,
      share: 2500,
      status: 'success',
      archived: true,
      isDemo: true,
    },
  ];
}
