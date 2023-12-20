import { ChangeDetectionStrategy, Component } from '@angular/core';


@Component({
  selector: 'pgz-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [],
})
export class ProfileComponent {

}
