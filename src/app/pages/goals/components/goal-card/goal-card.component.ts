import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import { IGoal } from '../../../../domain/goals.domain';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EditStateGoalService } from '../../service/edit-state-goal.service';


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

  @Output()
  public deleteGoal = new EventEmitter<IGoal>();

  constructor(
    private editStateService: EditStateGoalService,
    private router: Router
  ) { }

  public ngOnInit(): void {
    this.currentSum = this.calcCurrentSum();

    if(this.goal.status === 'progress' && this.currentSum - this.goal.finishSum > 1000) {
      console.log(this.currentSum - this.goal.finishSum)
      this.goal.status = 'success';
    }
    //TODO: додати логіку: додати статус archive, щоб перекидати в історію і не відображати в активному списку
  }

  public calcCurrentSum(): number {
    if(this.goal.status === 'progress') {
      const calcRate = this.goal.share / 100;
      return calcRate * this.costOfPortfolio;
    } else {
      return this.goal.share;
    }
  }

  public onEdit(): void {
    this.editStateService.saveEditStateGoal(this.goal);
    this.router.navigate(['/goals/add']);
  }

  public onDelete(): void {
    this.deleteGoal.emit(this.goal);
  }
}
