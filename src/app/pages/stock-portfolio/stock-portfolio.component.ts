import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { IPortfolioStock } from 'src/app/domain/portfolio.domain';
import { DashboardStateService } from 'src/app/service/dashboard-state.service';
import { PortfolioDataService } from 'src/app/service/portfolio-data.service';


@Component({
  selector: 'app-stock-portfolio',
  templateUrl: './stock-portfolio.component.html',
  styleUrls: ['./stock-portfolio.component.scss']
})
export class StockPortfolioComponent implements OnInit, OnDestroy {

  public stocks: IPortfolioStock[] = [];

  private stocksSubscription: Subscription | undefined;


  constructor(
    public stateService: DashboardStateService,
    public portfolioService: PortfolioDataService
  ) { }

  public ngOnInit(): void {
    this.stocksSubscription = this.portfolioService.stockFromActivePortfolio$
      .subscribe((stocks) => {
      this.stocks = stocks;
    });
  }

  public ngOnDestroy(): void {
    if (this.stocksSubscription) {
      this.stocksSubscription.unsubscribe();
    }
  }
}
