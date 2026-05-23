import { ChangeDetectionStrategy, Component, EventEmitter, HostBinding, HostListener, Input, Output } from '@angular/core';

@Component({
  selector: 'pgz-settings-row',
  standalone: true,
  templateUrl: './settings-row.component.html',
  styleUrl: './settings-row.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsRowComponent {
  /** Left label — the row title (e.g. "Profile settings", "Theme"). */
  @Input({ required: true }) public label!: string;

  /** Optional right-side value text shown before the chevron (e.g. "$2,200", "Auto", "EN"). */
  @Input() public value?: string | null;

  /** When true: muted label, no chevron, no click emit, "SOON" pill on the right. */
  @Input() public disabled: boolean = false;

  /** When true: muted label + no click, but no SOON pill (Support group rows). */
  @Input() public muted: boolean = false;

  /** Hide the chevron — used for read-only / disabled rows that should not look navigable. */
  @Input() public showChevron: boolean = true;

  /** Click emitted only when row is not disabled/muted. */
  @Output() public readonly action = new EventEmitter<void>();

  @HostBinding('class.is-disabled')
  public get hostDisabled(): boolean {
    return this.disabled;
  }

  @HostBinding('class.is-muted')
  public get hostMuted(): boolean {
    return this.muted;
  }

  @HostBinding('attr.role')
  public get role(): string {
    return this.disabled || this.muted ? 'group' : 'button';
  }

  @HostBinding('attr.tabindex')
  public get tabindex(): number {
    return this.disabled || this.muted ? -1 : 0;
  }

  @HostListener('click')
  public onClick(): void {
    if (this.disabled || this.muted) {
      return;
    }
    this.action.emit();
  }
}
