import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DonutComponent } from '../../../../core/UI/components/charts/donut/donut.component';
import { ID3Value } from '../../../../core/domain/d3.domain';


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
  @Input()
  public expends: ID3Value;
}
