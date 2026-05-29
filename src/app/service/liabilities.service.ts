import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ILiability } from '../domain/liability.domain';

/**
 * Frontend-first store for the user's liabilities (ADR-0009 · plan L1).
 * localStorage-backed, anonymous-safe — a direct mirror of `GoalsService`
 * (`IGoal`). Backend persistence (`/api/v1/liabilities`) is a later
 * quality-upgrade (plan L9), not a dependency.
 */
@Injectable({ providedIn: 'root' })
export class LiabilitiesService {
  private static readonly STORAGE_KEY = 'liabilitiesData';

  private liabilities: ILiability[] = [];
  public readonly $liabilities: BehaviorSubject<ILiability[]> =
    new BehaviorSubject<ILiability[]>([]);

  constructor() {
    this.liabilities = this.readFromStorage();
    this.$liabilities.next(this.liabilities);
  }

  public getAll(): Observable<ILiability[]> {
    return this.$liabilities;
  }

  public addLiability(liability: ILiability): void {
    if (liability.id == null) {
      liability.id = this.nextId();
    }
    this.liabilities = [...this.liabilities, liability];
    this.persist();
  }

  public updateLiability(liability: ILiability): void {
    if (liability.id == null) {
      return;
    }
    this.liabilities = this.liabilities.map((l) =>
      l.id === liability.id ? { ...l, ...liability } : l,
    );
    this.persist();
  }

  public deleteLiability(liability: ILiability): void {
    this.liabilities = this.liabilities.filter((l) => l.id !== liability.id);
    this.persist();
  }

  /** Current snapshot — used by the demo lifecycle to merge real + demo. */
  public snapshot(): ILiability[] {
    return this.liabilities;
  }

  /** Replace the whole list (demo seed / clear). */
  public replaceAll(list: ILiability[]): void {
    this.liabilities = [...list];
    this.persist();
  }

  // ---- internals ----

  private persist(): void {
    try {
      localStorage.setItem(
        LiabilitiesService.STORAGE_KEY,
        JSON.stringify(this.liabilities),
      );
    } catch {
      // Quota / private mode — non-critical; in-memory subject still drives
      // the current session.
    }
    this.$liabilities.next(this.liabilities);
  }

  private readFromStorage(): ILiability[] {
    try {
      const raw = localStorage.getItem(LiabilitiesService.STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as ILiability[]) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private nextId(): number {
    return this.liabilities.reduce((max, l) => Math.max(max, l.id ?? 0), 0) + 1;
  }
}
