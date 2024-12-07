import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';

@Component({
  selector: 'pgz-notification',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationComponent {
  constructor(@Inject(MAT_SNACK_BAR_DATA) public data: { message: string }) {}
}
