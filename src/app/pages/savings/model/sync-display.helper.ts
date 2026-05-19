import { IAccountV2 } from '../../../domain/account-v2.domain';

/**
 * UI tone for a sync status — drives the dot color in account rows and
 * widget legends. Mirrors the four-state machine documented in PR-A6:
 * fresh-ok, attention-needed, manual-only, never-tried.
 */
export type SyncTone = 'ok' | 'warn' | 'manual' | 'never';

/**
 * Pure mapping from {@link IAccountV2} sync metadata to the
 * `{ tone, label }` pair that PR-A6 widgets render under each account.
 * Extracted from `AccountRowComponent.statusLine` so Stats Task 1
 * widgets (`PerAccountBreakdownComponent`, future risk widgets) can
 * reuse the exact same copy without forking the logic.
 *
 * <p>Examples:
 * <ul>
 *   <li>OK + `lastSyncedAt=2h ago` → `{tone:'ok', label:'Synced 2h ago'}`</li>
 *   <li>STALE + `lastSyncedAt=3d ago` → `{tone:'warn', label:'Sync failed · 3d ago'}`</li>
 *   <li>MANUAL + no `lastSyncedAt` → `{tone:'manual', label:'Manual entry only'}`</li>
 *   <li>NEVER → `{tone:'never', label:'Never synced'}`</li>
 * </ul>
 *
 * @param now optional override for "now" — useful for deterministic
 *            tests. Defaults to {@code Date.now()}.
 */
export interface SyncDisplay {
  tone: SyncTone;
  label: string;
}

export function syncDisplayFor(account: IAccountV2, now: number = Date.now()): SyncDisplay {
  const status = account.syncStatus;
  const last = account.lastSyncedAt;

  if (account.accountType === 'MANUAL') {
    return {
      tone: 'manual',
      label: last ? `Manual · edited ${relativeFromNow(last, now)}` : 'Manual entry only',
    };
  }
  switch (status) {
    case 'OK':
      return { tone: 'ok', label: last ? `Synced ${relativeFromNow(last, now)}` : 'Synced' };
    case 'STALE':
    case 'ERROR':
      return {
        tone: 'warn',
        label: last ? `Sync failed · ${relativeFromNow(last, now)}` : 'Sync failed',
      };
    case 'NEVER':
    default:
      return { tone: 'never', label: 'Never synced' };
  }
}

/**
 * "2h ago" / "3d ago" / "just now". Same formatter as
 * `AccountRowComponent.relativeFromNow` — kept duplicated to avoid a
 * circular dep (component depends on this file, not the other way).
 */
function relativeFromNow(iso: string, now: number): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return 'unknown';
  const diffSec = Math.max(0, Math.floor((now - t) / 1000));
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}min ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d ago`;
}
