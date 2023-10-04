import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { IPortfolio } from 'src/app/domain/portfolio.domain';
import { PortfolioDataService } from 'src/app/service/portfolio-data.service';


@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.scss']
})
export class PortfolioComponent implements OnInit {
  public cpfValue: string[] = ['a','b','c'];

  public activePortfolio: IPortfolio | null = null;
  public portfolios: IPortfolio[] = [];
  public currentPortfolio: number = 0;

  public activePortfolioID: number = 0;

  private portfoliosSubscription: Subscription | undefined;

  constructor(
    public dialogService: MatDialog,
    public portfolioService: PortfolioDataService
  ) { }

  public ngOnInit(): void {
    this.portfoliosSubscription = this.portfolioService.portfolios$.subscribe(portfolios => {
      this.portfolios = portfolios;
      this.activePortfolio = portfolios.find((portfolio: IPortfolio) => portfolio.isActive) || portfolios[0];
      this.activePortfolioID = this.activePortfolio.accountID;
    });
  }

  public changePortfolio(portfolioID: number): void {
    this.portfolioService.setActiveAccount(this.portfolios[portfolioID].accountID);

    
    this.currentPortfolio = portfolioID;
  }

  public ngOnDestroy(): void {
    if (this.portfoliosSubscription) {
      this.portfoliosSubscription.unsubscribe();
    }
  }
}
