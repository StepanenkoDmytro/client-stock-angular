import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'pgz-button-toggle',
  standalone: true,
  imports: [],
  templateUrl: './button-toggle.component.html',
  styleUrl: './button-toggle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonToggleComponent {
  @Input()
  public dataUnchecked: string = '';
  @Input()
  public dataChecked: string = '';
  @Output()
  public buttonValue = new EventEmitter<boolean>();

  public checkButtonValue: boolean = true;

  public changeValue(): void {
    this.checkButtonValue = !this.checkButtonValue;
    this.buttonValue.emit(this.checkButtonValue);
  }
}
