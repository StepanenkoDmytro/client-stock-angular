import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MoneyPipe } from '../../../../../../pipe/money.pipe';

@Component({
  selector: 'pgz-stock-dashboard',
  standalone: true,
  imports: [MoneyPipe],
  templateUrl: './stock-dashboard.component.html',
  styleUrls: ['./stock-dashboard.component.scss', '../dashboard.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StockDashboardComponent {
  public balance: number = 0;
  public portfolioCost: number = 0;
  public monthlyBudget: number = 0;
  public spentByMonth: number = 0;
}
