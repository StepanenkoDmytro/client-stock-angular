import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import { IGoal } from '../../../../domain/goals.domain';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'pgz-goal-card',
  standalone: true,
  imports: [MatProgressBarModule, MatIconModule, CommonModule],
  templateUrl: './goal-card.component.html',
  styleUrl: './goal-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GoalCardComponent {
  @Input()
  public goal: IGoal;
}
