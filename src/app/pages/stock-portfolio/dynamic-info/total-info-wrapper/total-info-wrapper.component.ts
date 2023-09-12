import { Component } from '@angular/core';
import { DashboardStateService } from 'src/app/service/dashboard-state.service';


@Component({
  selector: 'app-total-info-wrapper',
  templateUrl: './total-info-wrapper.component.html',
  styleUrls: ['./total-info-wrapper.component.scss']
})
export class TotalInfoWrapperComponent {
  public isHiddenTotalInfoOpen: boolean = false;

  indexCtrl: boolean = true;
  profitCtrl: boolean = true;
  commodityCtrl: boolean = true;

  constructor(
    public stateService: DashboardStateService
  ) { }

  updateAllControls(): void {
    this.stateService.indexContainerVisible = this.indexCtrl;
    this.stateService.commodityContainerVisible = this.commodityCtrl;
    this.stateService.profitContainerVisible = this.profitCtrl;
  }
}
