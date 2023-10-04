import { Directive, HostListener, Input, OnInit } from '@angular/core';


export enum MaskType {
  DATE = 'date',
  TIME = 'time',
}

@Directive({
  selector: 'input[mask], textarea[mask]',
})
export class MaskDirective {

  @Input() regex: MaskType | null = null;
  @Input() forbidden: string[] = [];

  private maskTypeValues: Map<MaskType, RegExp[]> = new Map<MaskType, RegExp[]>([
    [MaskType.DATE, [/\d/, /\d/, /\//, /\d/, /\d/, /\//, /\d/, /\d/, /\d/, /\d/]],
    [MaskType.TIME, [/\d/, /\d/, /\:/, /\d/, /\d/]],
  ]);
  

  @HostListener('input', ['$event'])
  public onInputChange(event: Event) {
    const input = event.target as HTMLInputElement;

    if (this.regex) {
      this.checkRegexPattern(input);
    }

    if (this.forbidden.length) {
      this.checkForbiddenCharacters(input);
    }
  }

  private checkRegexPattern(input: HTMLInputElement): void {
    const inputValue = input.value;
    const indexOfLastChar = inputValue.length - 1;
    const regexType: RegExp[] = this.maskTypeValues.get(this.regex!)!;

    if(indexOfLastChar >= regexType.length) {
      input.value = inputValue.slice(0, indexOfLastChar);
      return;
    }
    
    const inputValueLastChar = inputValue[indexOfLastChar];
    if (!regexType[indexOfLastChar].test(inputValueLastChar)) {
      input.value = inputValue.slice(0, indexOfLastChar);
    }
  }

  private checkForbiddenCharacters(input: HTMLInputElement): void {
    if (this.forbidden.length < 1) {
      return;
    }

    const inputValue = input.value;
    const containsForbiddenChars = this.forbidden.some(char =>
      inputValue.at(inputValue.length - 1) === char
    );

    if (containsForbiddenChars) {
      input.value = inputValue.slice(0, inputValue.length - 1);
    }
  }
}
