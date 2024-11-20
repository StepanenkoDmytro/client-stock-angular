import { Pipe, PipeTransform } from '@angular/core';


@Pipe({
  name: 'dateFormat',
  standalone: true
})
export class DateFormatPipe implements PipeTransform {

  public transform(firstDate: moment.Moment | null, format: string = 'MMMM YYYY'): any {
    if (firstDate) {
        return firstDate.format(format);
    }
  }

}
