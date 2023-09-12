import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';


@Component({
  selector: 'app-total-info',
  templateUrl: './total-info.component.html',
  styleUrls: ['./total-info.component.scss']
})
export class TotalInfoComponent {
  
  @Input()
  public primaryInfoCtrl: boolean | null = null;
  @Input()
  public risknessInfoCtrl: boolean | null = null;
  @Input()
  public accountActionCtrl: boolean | null = null;

  public wallet = new FormControl('stockWallet');
}
