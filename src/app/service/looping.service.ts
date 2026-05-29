import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ILoopPosition } from '../domain/loop-position.domain';

/**
 * Frontend-first store for the user's looping (leverage) positions
 * (ADR-0013 · `docs/instruments/looping.md`). localStorage-backed,
 * anonymous-safe — a direct mirror of `LiabilitiesService` / `GoalsService`.
 * Net APY + accrued profit are computed client-side from each loop's
 * `openedAt`, so the whole feature works without a backend or login
 * (ADR-0012). Backend persistence is a later quality-upgrade, not a
 * dependency.
 */
@Injectable({ providedIn: 'root' })
export class LoopingService {
  private static readonly STORAGE_KEY = 'loopingData';

  private loops: ILoopPosition[] = [];
  public readonly $loops: BehaviorSubject<ILoopPosition[]> =
    new BehaviorSubject<ILoopPosition[]>([]);

  constructor() {
    this.loops = this.readFromStorage();
    this.$loops.next(this.loops);
  }

  public getAll(): Observable<ILoopPosition[]> {
    return this.$loops;
  }

  public addLoop(loop: ILoopPosition): void {
    if (loop.id == null) {
      loop.id = this.nextId();
    }
    this.loops = [...this.loops, loop];
    this.persist();
  }

  public updateLoop(loop: ILoopPosition): void {
    if (loop.id == null) {
      return;
    }
    this.loops = this.loops.map((l) =>
      l.id === loop.id ? { ...l, ...loop } : l,
    );
    this.persist();
  }

  public deleteLoop(loop: ILoopPosition): void {
    this.loops = this.loops.filter((l) => l.id !== loop.id);
    this.persist();
  }

  /** Current snapshot — used by the demo lifecycle to merge real + demo. */
  public snapshot(): ILoopPosition[] {
    return this.loops;
  }

  /** Replace the whole list (demo seed / clear). */
  public replaceAll(list: ILoopPosition[]): void {
    this.loops = [...list];
    this.persist();
  }

  // ---- internals ----

  private persist(): void {
    try {
      localStorage.setItem(
        LoopingService.STORAGE_KEY,
        JSON.stringify(this.loops),
      );
    } catch {
      // Quota / private mode — non-critical; in-memory subject still drives
      // the current session.
    }
    this.$loops.next(this.loops);
  }

  private readFromStorage(): ILoopPosition[] {
    try {
      const raw = localStorage.getItem(LoopingService.STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as ILoopPosition[]) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private nextId(): number {
    return this.loops.reduce((max, l) => Math.max(max, l.id ?? 0), 0) + 1;
  }
}
