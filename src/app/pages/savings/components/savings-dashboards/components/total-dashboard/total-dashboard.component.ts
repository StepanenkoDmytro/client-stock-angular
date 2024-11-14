import { AfterViewInit, ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MoneyPipe } from '../../../../../../pipe/money.pipe';

@Component({
  selector: 'pgz-total-dashboard',
  standalone: true,
  imports: [MoneyPipe],
  templateUrl: './total-dashboard.component.html',
  styleUrls: ['./total-dashboard.component.scss', '../dashboard.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TotalDashboardComponent implements OnInit, AfterViewInit {
  public balance: number = 0;
  public portfolioCost: number = 0;
  public monthlyBudget: number = 0;
  public spentByMonth: number = 0;

  ngAfterViewInit(): void {
    console.log('TotalDashboardComponent: ngAfterViewInit')
  }
  ngOnInit(): void {
    console.log('TotalDashboardComponent: OnInit')
  }
}
