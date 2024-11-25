import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'pgz-toggle-switch',
  standalone: true,
  imports: [],
  templateUrl: './toggle-switch.component.html',
  styleUrl: './toggle-switch.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToggleSwitchComponent implements OnInit{
  @Input()
  public checked: string = '';
  @Input()
  public unchecked: string = '';

  @Output()
  public buttonValue = new EventEmitter<string>();

  public activeChart: string = ''; 

  public ngOnInit(): void {
    this.activeChart = this.checked;
  }

  public switchChart(value: string): void {
    this.activeChart = value;
    this.buttonValue.emit(this.activeChart);
  }
}
