import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

import { DateService } from '../../../../service/date.service';
import { AsyncPipe } from '@angular/common';
import { DateFormatPipe } from '../date-format.pipe';


@Component({
  selector: 'pgz-selector',
  standalone: true,
  imports: [DateFormatPipe, AsyncPipe],
  templateUrl: './selector.component.html',
  styleUrl: './selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectorComponent implements OnInit {
  public currentDate: string;

  constructor(
    public dateService: DateService,
    ) { }

  public ngOnInit(): void {
    this.dateService.date.subscribe(date => {
      this.currentDate = date.format('MMMM YYYY');
    });
  }

  public go(dir: number): void {
    this.dateService.changeMonth(dir);
  }
}
