import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DonutComponent } from '../../../../core/UI/components/charts/donut/donut.component';


@Component({
  selector: 'pgz-total-info',
  standalone: true,
  imports: [DonutComponent],
  templateUrl: './total-info.component.html',
  styleUrl: './total-info.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TotalInfoComponent {
  public stocksMock = {
    title: 'Stocks',
    money: 2000,
  };
}
