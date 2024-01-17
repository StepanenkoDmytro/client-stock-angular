import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterModule } from '@angular/router';
import { IGoal } from '../../../../domain/goals.domain';
import { GoalsService } from '../../../../service/goals.service';


const MATERIAL_MODULES = [
  MatFormFieldModule,
  MatIconModule,
  MatInputModule,
  FormsModule,
  MatSelectModule,
  MatButtonModule
];

@Component({
  selector: 'pgz-add-goal',
  standalone: true,
  imports: [...MATERIAL_MODULES, RouterModule],
  templateUrl: './add-goal.component.html',
  styleUrl: './add-goal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddGoalComponent implements OnInit {
  public nameOfGoal: string;
  public costOfGoal: number;
  public shareOfGoal: number;
  public selectedStatus: any;

  public statuses: any[] = [
    {
      name: 'Share of portfolio',
      value: 'progress',
    },
    {
      name: 'Fixed sum',
      value: 'success',
    },
    {
      name: 'Not included in the portfolio',
      value: 'disabled',
    },
  ]; 

  constructor(
    private goalsService: GoalsService,
    private router: Router
  ) { }

  public ngOnInit(): void {
  }

  public saveGoals(): void {
    const goal: IGoal = {
      name: this.nameOfGoal,
      finishSum: this.costOfGoal,
      share: this.shareOfGoal,
      status: this.selectedStatus,
    }

    this.goalsService.addGoal(goal);
    this.router.navigate(['goals']);
  }
}


