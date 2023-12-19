import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DateFormatPipe } from '../date-format.pipe';
import { DateService } from '../date.service';
import moment from 'moment';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'pgz-selector',
  standalone: true,
  imports: [DateFormatPipe],
  templateUrl: './selector.component.html',
  styleUrl: './selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectorComponent {

  month: BehaviorSubject<moment.Moment> = new BehaviorSubject(moment());

  constructor(
    private dateService: DateService,
  ) { }

  go(dir: number) {
    this.dateService.changeMonth(dir);
  }
}
