import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { TotalBalanceComponent } from '../../core/UI/components/total-balance/total-balance.component';
import { GoalCardComponent } from './components/goal-card/goal-card.component';
import { IGoal } from '../../domain/goals.domain';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ButtonToggleComponent } from '../../core/UI/components/button-toggle/button-toggle.component';
import { MatButtonModule } from '@angular/material/button';


const UI_COMPONENTS = [
  TotalBalanceComponent,
  GoalCardComponent,
  ButtonToggleComponent
];

const MATERIAL_MODULES = [
  MatIconModule,
  MatButtonModule
];

@Component({
  selector: 'pgz-goals',
  standalone: true,
  imports: [...UI_COMPONENTS, ...MATERIAL_MODULES, RouterModule ],
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
        currentSum: 10000,
        finishSum: 40000,
        share: '20%',
        status: 'success',
      },
      {
        name: 'House',
        currentSum: 4000,
        finishSum: 40000,
        share: '20%',
        status: 'disabled',
      },
      {
        name: 'House',
        currentSum: 20000,
        finishSum: 40000,
        share: '20%',
        status: 'progress',
      }
    ];
  }
}
