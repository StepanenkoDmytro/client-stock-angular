import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';

@Component({
  selector: 'pgz-settings-card',
  standalone: true,
  template: `<ng-content></ng-content>`,
  styleUrl: './settings-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsCardComponent {
  @Input() public disabled: boolean = false;

  @HostBinding('class.is-disabled')
  public get hostDisabled(): boolean {
    return this.disabled;
  }
}
