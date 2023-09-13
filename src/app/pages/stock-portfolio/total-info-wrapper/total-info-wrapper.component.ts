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
  
  public isHiddenTotalInfoOpen: boolean = false;

  public portfolioCtrl: FormControl<IPortfolioBasic> = new FormControl();

  public activePortfolio: IPortfolio | null = null;
  public portfolios: IPortfolioBasic[] = [];

  private portfolioSubscription: Subscription | undefined;

  constructor(
    public stateService: DashboardStateService,
    public portfolioService: PortfolioDataService
  ) { }

  public ngOnInit(): void {
    this.portfolioSubscription = this.portfolioService.activePortfolio$
      .subscribe((portfolio) => {
      this.activePortfolio = portfolio;

      if (this.activePortfolio) {
        this.portfolioCtrl.setValue(this.activePortfolio);
      }
    });

    this.portfolios = this.portfolioService.portfolios;
  }

  public changePortfolio(portfolioID: number): void {
    this.portfolioService.setActiveAccount(portfolioID);
  }

  public ngOnDestroy(): void {
    if (this.portfolioSubscription) {
      this.portfolioSubscription.unsubscribe();
    }
  }
}
