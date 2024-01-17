import { Injectable } from '@angular/core';
import { IGoal } from '../domain/goals.domain';


@Injectable({
  providedIn: 'root'
})
export class GoalsService {
  private readonly localStorageKey = 'goalsData';
  public historyGoals: IGoal[] = [];

  constructor() { }
}
