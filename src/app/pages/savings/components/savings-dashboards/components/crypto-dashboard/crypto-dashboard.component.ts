import { AfterContentInit, AfterViewInit, ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MoneyPipe } from '../../../../../../pipe/money.pipe';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';


const MATERIAL = [
  MatButtonModule,
  MatExpansionModule,
  MatFormFieldModule,
];

@Component({
  selector: 'pgz-crypto-dashboard',
  standalone: true,
  imports: [MoneyPipe, ...MATERIAL],
  templateUrl: './crypto-dashboard.component.html',
  styleUrls: ['./crypto-dashboard.component.scss', '../dashboard.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CryptoDashboardComponent implements OnInit, AfterViewInit {
  public balance: number = 0;
  public portfolioCost: number = 0;
  public monthlyBudget: number = 0;
  public spentByMonth: number = 0;

  ngAfterViewInit(): void {
    console.log('CryptoDashboardComponent: ngAfterViewInit')
  }
  ngOnInit(): void {
    console.log('CryptoDashboardComponent: OnInit')
  }
}
