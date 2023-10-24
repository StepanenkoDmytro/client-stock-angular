import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({
  name: 'dateFormat',
  pure: false
})
export class DateFormatPipe implements PipeTransform {

  public transform(m: moment.Moment | null, format: string = 'MMMM YYYY'): any {
    if (m) {
        return m.format(format);
    }
}
}
