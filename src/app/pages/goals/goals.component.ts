import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TotalBalanceComponent } from '../../core/UI/components/total-balance/total-balance.component';

@Component({
  selector: 'pgz-goals',
  standalone: true,
  imports: [TotalBalanceComponent],
  templateUrl: './goals.component.html',
  styleUrl: './goals.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GoalsComponent {

}
