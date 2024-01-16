import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TotalBalanceComponent } from '../../core/UI/components/total-balance/total-balance.component';
import { GoalCardComponent } from './components/goal-card/goal-card.component';

@Component({
  selector: 'pgz-goals',
  standalone: true,
  imports: [TotalBalanceComponent, GoalCardComponent],
  templateUrl: './goals.component.html',
  styleUrl: './goals.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GoalsComponent {

}
