import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'pgz-arrow-back',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './arrow-back.component.html',
  styleUrl: './arrow-back.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArrowBackComponent {
  @Input()
  public useBlackColor: boolean = false;
  @Input()
  public rotateAngle: string = '45';
  @Input()
  public stroke: number = 2;
}
