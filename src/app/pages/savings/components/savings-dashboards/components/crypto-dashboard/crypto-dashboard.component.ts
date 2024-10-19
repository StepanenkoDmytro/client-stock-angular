import { AfterContentInit, ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MoneyPipe } from '../../../../../../pipe/money.pipe';

@Component({
  selector: 'pgz-crypto-dashboard',
  standalone: true,
  imports: [MoneyPipe],
  templateUrl: './crypto-dashboard.component.html',
  styleUrls: ['./crypto-dashboard.component.scss', '../dashboard.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CryptoDashboardComponent {
  public balance: number = 0;
  public portfolioCost: number = 0;
  public monthlyBudget: number = 0;
  public spentByMonth: number = 0;
}
