import { Component } from '@angular/core';
import { MNY_WIDGET } from 'src/app/domain/default-widget-state.domain';


@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.scss']
})
export class PortfolioComponent {

  public componentURL = MNY_WIDGET;
}
