import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconComponent } from "../../../../core/UI/components/icon/icon.component";
import { RouterModule } from '@angular/router';

@Component({
  selector: 'pgz-prev-route',
  standalone: true,
  imports: [IconComponent, RouterModule],
  templateUrl: './prev-route.component.html',
  styleUrl: './prev-route.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrevRouteComponent {
}
