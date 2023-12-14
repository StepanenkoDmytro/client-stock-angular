import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'pgz-progress',
  templateUrl: './progress.component.html',
  styleUrl: './progress.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: []
})
export class ProgressComponent {

  @Input()
  public bgColor: string = '#8fa19a'

  @Input()
  public progressColor: string = '#5FD1A5'

  @Input()
  public fontColor: string = '#fff'

  @Input()
  public progress: number = 0;

  @Input()
  public total: number = 100;

  @Input()
  public height: number = 16;

  @Input()
  public text: string = '';
}
