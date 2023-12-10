import { Component, Input } from '@angular/core';
import { IPortfolioStock } from '../../../domain';

@Component({
  selector: 'app-stock-card',
  templateUrl: './stock-card.component.html',
  styleUrls: ['./stock-card.component.scss']
})
export class StockCardComponent {
  @Input()
  public stock: IPortfolioStock;
}
