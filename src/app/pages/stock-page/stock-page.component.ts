import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { STOCK_WIDGET } from 'src/app/domain/default-widget-state.domain';

@Component({
  selector: 'app-stock-page',
  templateUrl: './stock-page.component.html',
  styleUrls: ['./stock-page.component.scss']
})
export class StockPageComponent implements OnInit {
  public isFullComponent: boolean = false;
  constructor(private router: Router) {

  }
  public ngOnInit(): void {
    const currentURL = this.router.url.substring(1);
    this.isFullComponent = this.componentURL === currentURL;
  }
  public componentURL = STOCK_WIDGET;
}
