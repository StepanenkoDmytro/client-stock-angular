import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';


@Component({
  selector: 'app-total-info-wrapper',
  templateUrl: './total-info-wrapper.component.html',
  styleUrls: ['./total-info-wrapper.component.scss']
})
export class TotalInfoWrapperComponent {

  wallet = new FormControl('bla');

  @Input()
  isPrimaryInfoVisible: boolean | null = null;
  @Input()
  isVisibleRiskness: boolean | null = null;
  @Input()
  isVisibleAccountAction: boolean | null = null;
}
