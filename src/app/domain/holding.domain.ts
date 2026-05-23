import { AccountKind } from './account-kind.domain';
import { IInstrument } from './instrument.domain';
import { ITag } from './tag.domain';

/**
 * IHoldingLockMeta — describes how an individual holding is locked or
 * earning yield at its Account. Discriminated union; variant drives which
 * countdown/APR/chip we render inside `pgz-position-row`.
 *
 * Optional on `IHolding`. Absent for spot, cash, hot wallets and other
 * fully-liquid positions. Present for exchange staking / earn products and
 * bank term deposits.
 *
 * Mirrors the Java sealed interface planned for M2 backend (Holding
 * `lock_meta` JSONB column). Until M2 it lives only as a frontend-only
 * field, populated by the mock-seed.
 *
 * Per ADR-0001 §`Holding.lockMeta`.
 */
export type IHoldingLockMeta =
  | StakingLockMeta
  | TermDepositLockMeta
  | FlexibleLockMeta;

export interface StakingLockMeta {
  kind: 'STAKING';
  /** Annual percentage rate, percent units (5 means 5%). */
  apr: number;
  /** ISO-8601 date the lock ends. Drives the days-left countdown. */
  lockEndDate?: string;
  /** Human-readable label, e.g. '30-day lock'. */
  lockPeriod?: string;
}

export interface TermDepositLockMeta {
  kind: 'TERM_DEPOSIT';
  apr?: number;
  /** ISO-8601 date the deposit matures. */
  maturityDate: string;
}

export interface FlexibleLockMeta {
  kind: 'FLEXIBLE';
  apr: number;
}

/**
 * IHolding — a single position the user holds: which instrument, where it
 * lives (account), how much, at what average buy price, and how it's tagged.
 *
 * Persistence-wise, holdings live in the `holdings` NgRx feature state (added
 * in PR4) and are mirrored to localStorage under the `'holdings-list'` key.
 * Backend sync (`HoldingsEffects` + REST `/api/v1/holdings`) lands in M5.
 *
 * Average buy price is maintained by `holdings.reducer.editHolding` per
 * formula:
 *   avg = (oldQty * oldAvg + newQty * newPrice) / (oldQty + newQty)
 * This carries over the existing logic from `asset.reducer.editAsset`.
 */
export interface IHolding {
  id: string;
  instrumentId: string;
  /**
   * Account the position lives on. Optional until Account UI lands; until
   * then `HoldingService` defaults this to the literal `'manual'` to keep
   * a single bucket for everything user-entered.
   */
  accountId?: string;
  /**
   * Human-readable label of the Account this holding lives on (e.g.
   * "Cold wallet (Trezor)", "Bybit Earn"). Optional, frontend-only until
   * a real Account model lands on the backend in M2. Used by
   * `pgz-position-row` to render the per-Account label inside a Position.
   */
  accountName?: string;
  /**
   * What kind of Account this holding sits on. Optional, frontend-only
   * until backend `Account.kind` arrives in M2. Drives the per-row icon
   * (cold ❄ / earn ⚡ / locked 🔒 / spot ·) and chip in `pgz-position-row`.
   * Currently populated by the mock-seed in `HoldingService`.
   *
   * Per `docs/notes/2026-05-pr3-position-card-task.md` §10 (risk #1).
   */
  accountKind?: AccountKind;
  /**
   * How this holding is locked / earning. Optional, frontend-only until
   * backend `holdings.lock_meta` JSONB column arrives in M2. Discriminated
   * union of STAKING / TERM_DEPOSIT / FLEXIBLE; absent for fully-liquid
   * positions (spot, cash, hot wallets).
   *
   * Per ADR-0001 §`Holding.lockMeta`.
   */
  lockMeta?: IHoldingLockMeta;
  /**
   * ISO-8601 timestamp when the user first opened this position at this
   * account. Optional; used by `pgz-position-row` to render "stored {duration}"
   * for cold-wallet holdings. Distinct from `createdAt` (the record's
   * timestamp): a user can backdate `openedAt` when they entered an old
   * position.
   */
  openedAt?: string;
  quantity: number;
  averageBuyPrice: number;
  /** ISO 4217. Usually equals `instrument.currency`. */
  currency: string;
  tagIds: string[];
  /** ISO-8601 timestamp. */
  createdAt: string;
  /** ISO-8601 timestamp. */
  updatedAt: string;
  /**
   * `true` once the record has been confirmed by the backend (via either
   * REST round-trip on create / update, or the canonical-state GET on
   * bootstrap). `false` for records that exist only in the client store
   * (anonymous mode, offline edit pending sync) — the signup-merge
   * wizard (Phase 3b PR5) scans for these.
   *
   * <p>Optional for backward compatibility with the existing seed and
   * pre-Phase-3b localStorage snapshots. Undefined is treated as `true`
   * (canonical) — only the explicit `false` marker triggers re-sync.
   *
   * <p>Per ADR-0012 §"Базовий патерн на entity" bullet 2.
   */
  isSaved?: boolean;
  /**
   * `true` for rows materialised by `DemoDataService.seed()` — illustrative
   * fixtures the user opted in to via the «Try with demo data» link or the
   * Profile «Restore demo» action. `DemoDataService.clear()` removes only
   * rows with this flag, leaving real entities (added via the normal flow)
   * untouched.
   *
   * <p>Optional / undefined is treated as `false` (real). Persists through
   * localStorage so demo rows survive a reload but never reach the
   * backend — per ADR-0012, demo entities live only on the client.
   *
   * <p>Per `docs/notes/2026-05-savings-empty-states-ladder.md` §4.2.
   */
  isDemo?: boolean;
}

/**
 * IHoldingView — joined projection produced by selectors.
 *
 * The selector resolves `instrumentId` against the InstrumentService cache
 * and `tagIds` against the Tags store. Components consume this shape and
 * never reach into the raw store themselves.
 */
export interface IHoldingView extends IHolding {
  instrument: IInstrument;
  tags: ITag[];
}
