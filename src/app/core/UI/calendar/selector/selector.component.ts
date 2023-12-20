import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DateFormatPipe } from '../date-format.pipe';
import { DateService } from '../../../../pages/spending/date.service';
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

  go(dir: number) {
    this.dateService.changeMonth(dir);
  }
}
