import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DashboardStateService {

  private _isIndexContainerVisible: boolean = true;
  private _isProfitContainerVisible: boolean = true;
  private _isCommodityContainerVisible: boolean = true;

  public get indexContainerVisible(): boolean {
    return this._isIndexContainerVisible;
  }

  public get profitContainerVisible(): boolean {
    return this._isProfitContainerVisible;
  }

  public get commodityContainerVisible(): boolean {
    return this._isCommodityContainerVisible;
  }

  public get risknessVisible(): boolean {
    const isRisknessVisible = ![this._isIndexContainerVisible, 
                                this._isProfitContainerVisible, 
                                this._isCommodityContainerVisible]
                                  .some(control => control === false);
    return isRisknessVisible;
  }

  public get primaryInfoVisible(): boolean {
    const index = this._isIndexContainerVisible;

    if (!index && (this.chartHasMinHeight || this.chartHasMaxWidth)) {
      return false;
    }

    return true;
  }

  public get accountActionVisible(): boolean {
    return !this.chartHasMinHeight;
  }

  public get chartHasMinHeight(): boolean {
    const isChartHasMinHeight = [this._isCommodityContainerVisible, this._isProfitContainerVisible]
                                  .some(control => control === false);

    return isChartHasMinHeight;
  }

  public get chartHasMaxWidth(): boolean {
    const isChartHasMaxWidth = [this._isCommodityContainerVisible, this._isProfitContainerVisible]
                                  .every(control => control === false)

    return isChartHasMaxWidth;
  }

  public get maxContent(): boolean {
    const isMaxContent = this._isIndexContainerVisible && this.chartHasMinHeight;
    return isMaxContent;
  }

  public get minContent(): boolean {
    const isMinContent = !this._isIndexContainerVisible && this.chartHasMinHeight;
    return isMinContent;
  }

  public set indexContainerVisible(isVisible: boolean) {
    this._isIndexContainerVisible = isVisible;
  }

  public set profitContainerVisible(isVisible: boolean) {
    this._isProfitContainerVisible = isVisible;
  }

  public set commodityContainerVisible(isVisible: boolean) {
    this._isCommodityContainerVisible = isVisible;
  }
}
