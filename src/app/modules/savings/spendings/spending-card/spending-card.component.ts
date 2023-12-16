import { Component, Input } from '@angular/core';
import { ISpending } from 'src/app/domain/portfolio.domain';

@Component({
  selector: 'app-spending-card',
  templateUrl: './spending-card.component.html',
  styleUrls: ['./spending-card.component.scss'],
})
export class SpendingCardComponent {
  @Input()
  public spending: ISpending;
}
