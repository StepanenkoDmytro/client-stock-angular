import { Component, Input } from '@angular/core';
import { IPortfolio } from 'src/app/domain/portfolio.domain';

@Component({
  selector: 'app-total-info-card',
  templateUrl: './total-info-card.component.html',
  styleUrls: ['./total-info-card.component.scss']
})
export class TotalInfoCardComponent {

  @Input()
  public portfolio: IPortfolio | null = null;
}
