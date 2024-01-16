import { ChangeDetectionStrategy, Component, Input } from '@angular/core';


@Component({
  selector: 'pgz-total-balance',
  standalone: true,
  imports: [],
  templateUrl: './total-balance.component.html',
  styleUrl: './total-balance.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TotalBalanceComponent {

  @Input()
  public balance: string | number = 100000;
}
