import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { ISpending } from '../../../../../domain/spending.domain';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { IconComponent } from '../../../../../core/UI/components/icon/icon.component';


@Component({
  selector: 'pgz-history-spending-card',
  standalone: true,
  imports: [MatIconModule, MatMenuModule, IconComponent],
  templateUrl: './history-spending-card.component.html',
  styleUrl: './history-spending-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistorySpendingCardComponent {
  @Input()
  public spending: ISpending;
}
