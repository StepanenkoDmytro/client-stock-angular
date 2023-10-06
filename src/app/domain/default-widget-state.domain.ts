import { IWidgetState } from "./widget.domain";

export const STOCK_WIDGET: string = 'stock-widget'; 
export const MNY_WIDGET: string = 'money-widget';

export const STOCK_WIDGET_DEFAULT: IWidgetState = {
    nameWidget: STOCK_WIDGET,
    primary: ['chart'],
      work: [
        'indices',
        'profit',
        'commodities'
      ],
}

export const MNY_WIDGET_DEFAULT: IWidgetState = {
  nameWidget: MNY_WIDGET,
  primary: ['chart'],
    work: [
      'indices',
      'profit',
      'commodities',
      'stock'
    ],
  }
  