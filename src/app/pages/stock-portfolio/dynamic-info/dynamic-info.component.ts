import { Component } from '@angular/core';
import { DashboardStateService } from 'src/app/service/dashboard-state.service';


@Component({
  selector: 'app-dynamic-info',
  templateUrl: './dynamic-info.component.html',
  styleUrls: ['./dynamic-info.component.scss']
})
export class DynamicInfoComponent {

  constructor(
    public stateService: DashboardStateService
  ) { }
}
