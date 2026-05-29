import { Injectable } from '@angular/core';
import { IGoal } from '../domain/goals.domain';
import { SavingsService } from './savings.service';
import { BehaviorSubject, Observable, of } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class GoalsService {
  private readonly localStorageKey = 'goalsData';
  public $historyGoals: BehaviorSubject<IGoal[]> = new BehaviorSubject<IGoal[]>([]);
  private historyGoalsSubject: IGoal[] = [];

  constructor() {
    const storedData = localStorage.getItem(this.localStorageKey);
    const parse: IGoal[] = JSON.parse(storedData);

    if(parse !== null) {
      this.historyGoalsSubject = parse;
      this.$historyGoals.next(this.historyGoalsSubject);
    }
  }

  public getAll(): Observable<IGoal[]> {

    return this.$historyGoals;
  }

  public addGoal(goal: IGoal):void {
    if(goal.status == null) {
      throw Error('cost or name of product can not be null')
    }

    if(goal.id == null) {
      goal.id = this.getLastId();
    }

    // Emit a fresh array (not the mutated reference) so `toSignal`
    // consumers — which compare with Object.is — pick up the change. The
    // legacy /goals page copies on subscribe regardless, so this is safe.
    this.historyGoalsSubject = [...this.historyGoalsSubject, goal];
    localStorage.setItem(this.localStorageKey, JSON.stringify(this.historyGoalsSubject));
    this.$historyGoals.next(this.historyGoalsSubject);
  }

  public deleteGoal(goal: IGoal): void {
    this.historyGoalsSubject = this.historyGoalsSubject.filter(
      (g) => !(g === goal || (goal.id != null && g.id === goal.id)),
    );
    localStorage.setItem(this.localStorageKey, JSON.stringify(this.historyGoalsSubject));
    this.$historyGoals.next(this.historyGoalsSubject);
  }

  /**
   * Replace an existing goal in place (matched by reference or id). Used by
   * the Statistics → Goals editor (A14, mockup analytics/16) for Edit. Emits
   * a fresh array so signal / OnPush consumers react. Falls back to {@link
   * addGoal} when the goal has no id and isn't already in the list.
   */
  public updateGoal(goal: IGoal): void {
    const exists = this.historyGoalsSubject.some(
      (g) => g === goal || (goal.id != null && g.id === goal.id),
    );
    if (!exists) {
      this.addGoal(goal);
      return;
    }
    this.historyGoalsSubject = this.historyGoalsSubject.map((g) =>
      g === goal || (goal.id != null && g.id === goal.id) ? { ...goal } : g,
    );
    localStorage.setItem(this.localStorageKey, JSON.stringify(this.historyGoalsSubject));
    this.$historyGoals.next(this.historyGoalsSubject);
  }

  /**
   * Move a goal to / from History (archive). Emits a fresh array so signal /
   * OnPush consumers pick up the change (the other mutators reuse the same
   * reference, which is why callers copy on subscribe).
   */
  public setArchived(goal: IGoal, archived: boolean): void {
    this.historyGoalsSubject = this.historyGoalsSubject.map((g) =>
      g === goal || (goal.id != null && g.id === goal.id)
        ? { ...g, archived }
        : g,
    );
    localStorage.setItem(this.localStorageKey, JSON.stringify(this.historyGoalsSubject));
    this.$historyGoals.next(this.historyGoalsSubject);
  }

  /** Current snapshot — used by the demo lifecycle to merge real + demo. */
  public snapshot(): IGoal[] {
    return this.historyGoalsSubject;
  }

  /** Replace the whole list (demo seed / clear). */
  public replaceAll(goals: IGoal[]): void {
    this.historyGoalsSubject = [...goals];
    localStorage.setItem(this.localStorageKey, JSON.stringify(this.historyGoalsSubject));
    this.$historyGoals.next(this.historyGoalsSubject);
  }

  private getLastId(): number {
    return this.historyGoalsSubject.length + 1;
  }
}
