import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { IPortfolio, IPortfolioBasic } from 'src/app/domain/portfolio.domain';
import { DashboardStateService } from 'src/app/service/dashboard-state.service';
import { PortfolioDataService } from 'src/app/service/portfolio-data.service';


@Component({
  selector: 'app-total-info-wrapper',
  templateUrl: './total-info-wrapper.component.html',
  styleUrls: ['./total-info-wrapper.component.scss']
})
export class TotalInfoWrapperComponent implements OnInit, OnDestroy {

  public portfolioCtrl: FormControl<IPortfolioBasic> = new FormControl();

  public activePortfolio: IPortfolio | null = null;
  public portfolios: IPortfolio[] = [];

  private portfoliosSubscription: Subscription | undefined;

  constructor(
    public stateService: DashboardStateService,
    public portfolioService: PortfolioDataService
  ) { }

  public ngOnInit(): void {
    this.portfoliosSubscription = this.portfolioService.portfolios$.subscribe(portfolios => {
      this.portfolios = portfolios;

      this.activePortfolio = portfolios.find((portfolio: IPortfolio) => portfolio.isActive) || portfolios[0];
    });
  }

  public changePortfolio(portfolioID: number): void {
    this.portfolioService.setActiveAccount(portfolioID);
  }

  public ngOnDestroy(): void {
    if (this.portfoliosSubscription) {
      this.portfoliosSubscription.unsubscribe();
    }
  }
}
