import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'pgz-add-btn',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './add-btn.component.html',
  styleUrl: './add-btn.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddBtnComponent {
  @Input()
  public width: number = 40;
  @Input()
  public backgroundColor: string = '#FDFEFF'
  @Input()
  public strokeColor: string = '#000';
  @Input()
  public strokeWidth: number = 1;
}
