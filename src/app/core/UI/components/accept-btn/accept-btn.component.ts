import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'pgz-accept-btn',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './accept-btn.component.html',
  styleUrl: './accept-btn.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AcceptBtnComponent {
  @Input()
  public active: boolean = true;
}
