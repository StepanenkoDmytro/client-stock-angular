import { Pipe, PipeTransform } from '@angular/core';


@Pipe({
  name: 'dateFormat',
  standalone: true
})
export class DateFormatPipe implements PipeTransform {

  public transform(m: moment.Moment | null, format: string = 'MMMM YYYY'): any {
    if (m) {
        return m.format(format);
    }
  }

}
