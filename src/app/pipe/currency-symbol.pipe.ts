import { Pipe, PipeTransform } from '@angular/core';
import { currencySymbol } from '../core/UI/util/currency-symbol';

@Pipe({ name: 'pgzCurrencySymbol', standalone: true, pure: true })
export class CurrencySymbolPipe implements PipeTransform {
  public transform(code: string | null | undefined): string {
    return currencySymbol(code);
  }
}
