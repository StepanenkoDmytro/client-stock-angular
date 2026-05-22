import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { ArrowBackComponent } from '../../../../core/UI/components/arrow-back/arrow-back.component';

@Component({
  selector: 'pgz-auth-container',
  standalone: true,
  imports: [ArrowBackComponent, RouterOutlet, RouterModule],
  templateUrl: './auth-container.component.html',
  styleUrl: './auth-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
// M5.6 PR5c: lifecycle hooks for body.hide-after toggling removed —
// the decorative cubs.png layer they were guarding against is gone
// from styles.scss, so the toggle had nothing to toggle.
export class AuthContainerComponent {}
