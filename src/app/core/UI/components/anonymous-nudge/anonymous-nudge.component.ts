import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'pgz-anonymous-nudge',
  standalone: true,
  templateUrl: './anonymous-nudge.component.html',
  styleUrl: './anonymous-nudge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnonymousNudgeComponent {
  @Output() public readonly signUp = new EventEmitter<void>();
  @Output() public readonly dismiss = new EventEmitter<void>();

  public onSignUp(): void {
    this.signUp.emit();
  }

  public onDismiss(): void {
    this.dismiss.emit();
  }
}
