import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'pgz-auth-container',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './auth-container.component.html',
  styleUrl: './auth-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthContainerComponent {

}
