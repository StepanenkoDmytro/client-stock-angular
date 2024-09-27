import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'pgz-icon',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IconComponent {

  public _src: string = '';
  public _isSVG: boolean = true;

  @Input('name')
  public set name(src: string) {
    this._src = src;
    this._isSVG = src.startsWith('custom_');
  }
}
