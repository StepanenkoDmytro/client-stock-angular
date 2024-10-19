import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'pgz-stock-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './stock-dashboard.component.html',
  styleUrl: './stock-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StockDashboardComponent {

}
