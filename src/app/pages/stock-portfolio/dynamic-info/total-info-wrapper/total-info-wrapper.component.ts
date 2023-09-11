import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';


@Component({
  selector: 'app-total-info-wrapper',
  templateUrl: './total-info-wrapper.component.html',
  styleUrls: ['./total-info-wrapper.component.scss']
})
export class TotalInfoWrapperComponent {

  public wallet = new FormControl('bla');

  @Input()
  public isPrimaryInfoVisible: boolean | null = null;
  @Input()
  public isVisibleRiskness: boolean | null = null;
  @Input()
  public isVisibleAccountAction: boolean | null = null;
}
