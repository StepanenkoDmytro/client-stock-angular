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

  public addSpending(goal: IGoal):void {
    if(goal.status == null) {
      throw Error('cost or name of product can not be null')
    }

    if(goal.id == null) {
      goal.id = this.getLastId();
    }

    this.historyGoalsSubject.push(goal);
    localStorage.setItem(this.localStorageKey, JSON.stringify(this.historyGoalsSubject));
    this.$historyGoals.next(this.historyGoalsSubject);
  }

  private getLastId(): number {
    return this.historyGoalsSubject.length + 1;
  }
}
