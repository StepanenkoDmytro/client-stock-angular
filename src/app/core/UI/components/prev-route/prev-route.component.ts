import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IconComponent } from "../icon/icon.component";
import { RouterModule } from '@angular/router';
import { ArrowBackComponent } from '../arrow-back/arrow-back.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'pgz-prev-route',
  standalone: true,
  imports: [CommonModule, RouterModule, ArrowBackComponent],
  templateUrl: './prev-route.component.html',
  styleUrl: './prev-route.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrevRouteComponent {
  @Input()
  public showArrow: boolean = true;
  @Input()
  public hideBackgroundColor = false;
}
