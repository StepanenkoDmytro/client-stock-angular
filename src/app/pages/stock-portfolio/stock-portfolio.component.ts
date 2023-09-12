import { Component } from '@angular/core';
import { DashboardStateService } from 'src/app/service/dashboard-state.service';


@Component({
  selector: 'app-stock-portfolio',
  templateUrl: './stock-portfolio.component.html',
  styleUrls: ['./stock-portfolio.component.scss']
})
export class StockPortfolioComponent {

  constructor(
    public stateService: DashboardStateService
  ) { }
}
