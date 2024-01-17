import { Injectable } from '@angular/core';
import { IGoal } from '../../../domain/goals.domain';
import { Route } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class EditStateGoalService {
  public editStateGoal: IGoal = null;

  public saveEditStateGoal(goal: IGoal): void {
    this.editStateGoal = goal;
  }

  public destroyEditStateGoal(): void {
    this.editStateGoal = null;
  }
}
