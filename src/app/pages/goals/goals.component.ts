import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { TotalBalanceComponent } from '../../core/UI/components/total-balance/total-balance.component';
import { GoalCardComponent } from './components/goal-card/goal-card.component';
import { IGoal } from '../../domain/goals.domain';

@Component({
  selector: 'pgz-goals',
  standalone: true,
  imports: [TotalBalanceComponent, GoalCardComponent],
  templateUrl: './goals.component.html',
  styleUrl: './goals.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GoalsComponent implements OnInit {
  public goals: IGoal[];

  constructor() { }
  public ngOnInit(): void {
    this.goals = [
      {
        name: 'House',
        currentSum: 4000,
        finishSum: 40000,
        share: '20%',
        status: 'active',
      },
      {
        name: 'House',
        currentSum: 4000,
        finishSum: 40000,
        share: '20%',
        status: 'active',
      },
      {
        name: 'House',
        currentSum: 4000,
        finishSum: 40000,
        share: '20%',
        status: 'active',
      }
    ];
  }
}
