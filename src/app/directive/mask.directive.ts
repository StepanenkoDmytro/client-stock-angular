import { Directive, HostListener, Input, OnInit } from '@angular/core';
import * as moment from 'moment';


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

  // private maskTypeValues: Map<MaskType, RegExp[]> = new Map<MaskType, RegExp[]>([
  //   [MaskType.DATE, [/\d/, /\d/, /\//, /\d/, /\d/, /\//, /\d/, /\d/, /\d/, /\d/]],
  //   [MaskType.TIME, [/\d/, /\d/, /\:/, /\d/, /\d/]],
  // ]);

  private datePattern: RegExp = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;


  @HostListener('input', ['$event'])
  public onInputChange(event: Event) {
    const input = event.target as HTMLInputElement;

    if (this.forbidden.length) {
      this.checkForbiddenCharacters(input);
    }

    if (this.regex) {
      this.checkRegexPattern(input);
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

  private checkRegexPattern(input: HTMLInputElement): void {
    this.ensureLeadingZeroes(input);

    const inputValue = input.value;
    const complited = this.compliteInput(inputValue);
    console.log(inputValue, complited);
    
    if (!this.datePattern.test(complited)) {
      input.value = inputValue.slice(0, inputValue.length - 1);
    }
  }
  private compliteInput(inputValue: string): string {
    const defaultDate = '01/01/1001';
    const complited = inputValue + defaultDate.slice(inputValue.length, defaultDate.length);
    return complited;
  }

  private ensureLeadingZeroes(input: HTMLInputElement): void {
    const inputValue = input.value;
    if(inputValue.length === 1 && parseInt(inputValue) > 3) {
      input.value = `0${inputValue}/`;
    }

    if (inputValue.length === 2 && inputValue.charAt(1) === '/') {
      input.value = `0${inputValue}/`;
    } 

    if (inputValue.length === 5 && inputValue.charAt(4) === '/') {
      input.value = `${inputValue.slice(0, 3)}0${inputValue.slice(3)}`;
    }
  }
}
