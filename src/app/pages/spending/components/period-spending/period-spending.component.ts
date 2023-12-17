import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DonutComponent } from '../../../../core/UI/components/charts/donut/donut.component';

const UI_COMPONENTS = [
  DonutComponent,
];

@Component({
  selector: 'pgz-period-spending',
  standalone: true,
  imports: [...UI_COMPONENTS],
  templateUrl: './period-spending.component.html',
  styleUrl: './period-spending.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PeriodSpendingComponent {
  public expends = {
    title: '',
    money: '2 000 000',
  };
}
