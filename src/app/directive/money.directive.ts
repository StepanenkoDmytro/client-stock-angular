import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[pgzMoney]',
  standalone: true
})
export class MoneyDirective {

  @HostListener('input', ['$event'])
  public onInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const inputValue = input.value;

    if (inputValue.startsWith('0') && !inputValue.startsWith('0.') && inputValue !== '0') {
      input.value = inputValue.slice(1);
      return;
    }

    const dotIndex = inputValue.indexOf('.');
    if (dotIndex !== -1) {
      const afterDot = inputValue.substring(dotIndex + 1, inputValue.length);
      if(afterDot.length > 2) {
        input.value = inputValue.slice(0, -1);
      }
    }
  }
}
