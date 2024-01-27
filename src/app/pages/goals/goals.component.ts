import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { TotalBalanceComponent } from '../../core/UI/components/total-balance/total-balance.component';
import { GoalCardComponent } from './components/goal-card/goal-card.component';
import { IGoal } from '../../domain/goals.domain';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ButtonToggleComponent } from '../../core/UI/components/button-toggle/button-toggle.component';
import { MatButtonModule } from '@angular/material/button';
import { SavingsService } from '../../service/savings.service';
import { GoalsService } from '../../service/goals.service';


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
  public portfolioCost: number = 0;

  constructor(
    private savingsService: SavingsService,
    private goalsService: GoalsService
  ) { }
  public ngOnInit(): void {
    
    // this.savingsService.getCostOfAllAssets().subscribe(val => {
    //   if(val) {
    //     this.portfolioCost = val;
    //   }
    // });

    this.goalsService.getAll().subscribe(goals => {
      this.goals = goals;
    });
  }

  public onDeleteGoal(deletedGoal: IGoal) {
    this.goalsService.deleteGoal(deletedGoal);
  }
}
