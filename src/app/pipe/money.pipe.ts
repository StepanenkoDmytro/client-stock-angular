import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'moneyFormat',
  standalone: true
})
export class MoneyPipe implements PipeTransform {

  transform(value: number): string {
    const formattedValue = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

    return formattedValue.replace('$', '').replace(',', ' ').trim();
  }
}
