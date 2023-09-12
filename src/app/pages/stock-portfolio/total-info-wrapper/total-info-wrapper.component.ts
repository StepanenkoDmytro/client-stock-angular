import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { DashboardStateService } from 'src/app/service/dashboard-state.service';


@Component({
  selector: 'app-total-info-wrapper',
  templateUrl: './total-info-wrapper.component.html',
  styleUrls: ['./total-info-wrapper.component.scss']
})
export class TotalInfoWrapperComponent {
  public isHiddenTotalInfoOpen: boolean = false;

  public wallet = new FormControl('stockWallet');

  constructor(
    public stateService: DashboardStateService
  ) { }
}
