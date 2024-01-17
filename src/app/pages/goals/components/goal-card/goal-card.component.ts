import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
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
export class GoalCardComponent implements OnInit {
  @Input()
  public goal: IGoal;
  @Input()
  public costOfPortfolio: number;
  public currentSum: number;

  public ngOnInit(): void {
    this.currentSum = this.calcCurrentSum();
  }

  public calcCurrentSum(): number {
    if(this.goal.status === 'progress') {
      const calcRate = this.goal.share / 100;
      return calcRate * this.costOfPortfolio;
    } else {
      return this.goal.share;
    }
  }
}
