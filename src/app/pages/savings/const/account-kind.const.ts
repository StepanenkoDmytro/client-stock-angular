import {
  AccountKind,
  ACCOUNT_KINDS,
} from '../../../domain/account-kind.domain';
import { IHolding } from '../../../domain/holding.domain';

/**
 * Per-AccountKind UI hint: which Unicode icon to put before the account
 * name in `pgz-position-row`, optional textual label (for chips), and a
 * colour token to fill the icon with.
 *
 * `icon === null` means "render an empty 16px slot" so the per-row layout
 * stays vertically aligned across rows of different kinds.
 *
 * Colours are intentionally hex literals (not CSS tokens) — they identify
 * the *kind* visually and are not part of the theme. See
 * `docs/notes/2026-05-pr3-position-card-task.md` §5 / §10.
 */
export interface AccountKindFlag {
  /** Unicode character or null. Rendered as a leading glyph. */
  icon: string | null;
  /** Short label, e.g. for a chip in meta line. null when not surfaced. */
  label: string | null;
  /** Hex colour applied to icon fill / chip border. */
  colorVar: string;
}

/**
 * Canonical mapping from AccountKind to its UI hint. Keep in sync with
 * `AccountKind` — `ACCOUNT_KIND_FLAGS_COVERAGE` (below) enforces this at
 * test time.
 *
 * Per `docs/notes/2026-05-pr3-position-card-task.md` §4.
 */
export const ACCOUNT_KIND_FLAGS: Record<AccountKind, AccountKindFlag> = {
  WALLET_COLD:      { icon: '❄', label: 'Cold storage',    colorVar: '#185FA5' },
  EXCHANGE_EARN:    { icon: '⚡', label: 'Earning',         colorVar: '#BA7517' },
  BANK_DEPOSIT:     { icon: '🔒', label: 'Locked',          colorVar: '#888780' },
  EXCHANGE_SPOT:    { icon: '·',  label: null,              colorVar: '#888780' },
  BROKERAGE_CASH:   { icon: null, label: null,              colorVar: '#888780' },
  BROKERAGE_MARGIN: { icon: null, label: 'Margin',          colorVar: '#A32D2D' },
  EXCHANGE_FUTURES: { icon: null, label: 'Futures',         colorVar: '#A32D2D' },
  WALLET_HOT:       { icon: null, label: null,              colorVar: '#888780' },
  BANK_SAVINGS:     { icon: null, label: null,              colorVar: '#888780' },
  BANK_CURRENT:     { icon: null, label: null,              colorVar: '#888780' },
  MANUAL:           { icon: null, label: null,              colorVar: '#888780' },
};

/**
 * Compile-time + test-time guard: keep this array in sync with both the
 * AccountKind union and `ACCOUNT_KIND_FLAGS`. The spec file iterates it
 * and asserts every kind has a flag entry.
 */
export const ACCOUNT_KIND_FLAGS_COVERAGE: readonly AccountKind[] = ACCOUNT_KINDS;

/**
 * Resolves the kind of Account a holding lives on.
 *
 * We deliberately do not run a name-based heuristic (per the original
 * ADR-0001 sketch) because the frontend has no Account entity with
 * `name`/`type` fields yet — those land in M2. Until then, the mock-seed
 * writes `accountKind` directly into `IHolding`; this helper just reads
 * it back with a safe `'MANUAL'` fallback so the per-row UI never crashes
 * for user-entered holdings that pre-date the new field.
 *
 * Per `docs/notes/2026-05-pr3-position-card-task.md` §4 + §10 (risk #1).
 */
export function accountKindOf(holding: Pick<IHolding, 'accountKind'>): AccountKind {
  return holding.accountKind ?? 'MANUAL';
}
