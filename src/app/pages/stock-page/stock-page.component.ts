import { Component, OnInit } from '@angular/core';
import { STOCK_WIDGET } from 'src/app/domain/default-widget-state.domain';

@Component({
  selector: 'app-stock-page',
  templateUrl: './stock-page.component.html',
  styleUrls: ['./stock-page.component.scss']
})
export class StockPageComponent {
  public componentURL = STOCK_WIDGET;
}
