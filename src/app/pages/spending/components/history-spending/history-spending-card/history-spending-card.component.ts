import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { ISpending } from '../../../../../domain/spending.domain';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';


@Component({
  selector: 'pgz-history-spending-card',
  standalone: true,
  imports: [MatIconModule, MatMenuModule],
  templateUrl: './history-spending-card.component.html',
  styleUrl: './history-spending-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistorySpendingCardComponent implements OnInit {
  @Input()
  public spending: ISpending;

  ngOnInit() {
    console.log('===', this.spending)
  }
}
