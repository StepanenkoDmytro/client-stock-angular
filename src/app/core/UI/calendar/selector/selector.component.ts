import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DateFormatPipe } from '../date-format.pipe';
import { DateService } from '../../../../service/date.service';
import { AsyncPipe } from '@angular/common';


@Component({
  selector: 'pgz-selector',
  standalone: true,
  imports: [DateFormatPipe, AsyncPipe],
  templateUrl: './selector.component.html',
  styleUrl: './selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectorComponent {

  constructor(
    public dateService: DateService,
  ) { }

  public go(dir: number): void {
    this.dateService.changeMonth(dir);
  }
}
