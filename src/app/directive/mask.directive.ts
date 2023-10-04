import { Directive, HostListener, Input } from '@angular/core';

@Directive({
  selector: 'input[mask], textarea[mask]',
})
export class MaskDirective {

  @Input() regex: string = '';
  @Input() forbidden: string[] = [];

  constructor() { }

  @HostListener('input', ['$event'])
  public onInputChange(event: Event) {
    const input = event.target as HTMLInputElement;

    this.checkRegularPattern(input);
    this.checkForbiddenCharacters(input);
  }

  private checkRegularPattern(input: HTMLInputElement): void {
    const inputValue = input.value;
    if (!this.regex) {
      return;
    }

    const regex = new RegExp(this.regex);
    if (!regex.test(inputValue)) {
      input.value = inputValue.slice(0, inputValue.length - 1);
      return;
    }
  }

  private checkForbiddenCharacters(input: HTMLInputElement): void {
    const inputValue = input.value;
    if(this.forbidden.length < 1) {
      return;
    }

    const containsForbiddenChars = this.forbidden.some(char =>
      inputValue.includes(char)
    );

    if (containsForbiddenChars) {
      input.value = inputValue.slice(0, inputValue.length - 1);
      return;
    }
  }
}
