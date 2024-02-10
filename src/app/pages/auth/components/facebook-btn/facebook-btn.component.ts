import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconComponent } from '../../../../core/UI/components/icon/icon.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'pgz-facebook-btn',
  standalone: true,
  imports: [IconComponent, MatIconModule, MatButtonModule],
  templateUrl: './facebook-btn.component.html',
  styleUrl: './facebook-btn.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FacebookBtnComponent {

}
