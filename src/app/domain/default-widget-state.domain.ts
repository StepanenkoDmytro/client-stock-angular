import { IWidgetState } from "./widget.domain";

export const STOCK_WIDGET_DEFAULT: IWidgetState = {
    nameWidget: 'stock-portfolio',
    primary: ['chart'],
      work: [
        'indices',
        'profit',
        'commodities'
      ],
}