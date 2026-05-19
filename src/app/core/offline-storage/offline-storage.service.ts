import { Injectable } from '@angular/core';

/**
 * Per-entity localStorage queue for IDs whose remote DELETE failed
 * transiently and should be re-attempted on the next sync pass.
 *
 * <p>Phase 3b move (ADR-0012 §"Що це ламає"): previously lived under
 * `pages/spending/service/` with hardcoded keys for spendings only.
 * Now generic — pass an `entityKey` (e.g. `'spendings'`, `'holdings'`,
 * `'cashflows'`) and each entity gets its own isolated queue, matching
 * the CC-6 convention that every domain entity follows the same
 * local-first + cloud-sync pattern.
 *
 * <p>The shape is intentionally minimal — just `enqueue` (append) and
 * `drain` (read-all + clear atomically). No retries/backoff metadata
 * lives here; that's the sync service's job per ADR-0012.
 */
@Injectable({ providedIn: 'root' })
export class OfflineStorageService {
  private static readonly DELETE_QUEUE_PREFIX = 'failed-requests-';

  /**
   * Append an id to the deletion queue for the given entity. Idempotent
   * if the same id is enqueued twice — `drainDeletes` returns duplicates
   * but the second DELETE round-trip just 404s harmlessly.
   */
  public enqueueDelete(entityKey: string, id: string): void {
    const key = OfflineStorageService.queueKey(entityKey);
    const queue = this.read(key);
    queue.push(id);
    localStorage.setItem(key, JSON.stringify(queue));
  }

  /**
   * Read-and-clear the deletion queue. If a returned DELETE fails again
   * the caller is expected to re-enqueue. The clear-on-read pattern keeps
   * the queue from growing across a stuck server outage — failures just
   * cycle back through the next sync pass.
   */
  public drainDeletes(entityKey: string): string[] {
    const key = OfflineStorageService.queueKey(entityKey);
    const queue = this.read(key);
    if (queue.length > 0) {
      localStorage.setItem(key, JSON.stringify([]));
    }
    return queue;
  }

  private read(key: string): string[] {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return [];
    }
    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
      return [];
    }
  }

  private static queueKey(entityKey: string): string {
    return `${OfflineStorageService.DELETE_QUEUE_PREFIX}${entityKey}`;
  }
}
