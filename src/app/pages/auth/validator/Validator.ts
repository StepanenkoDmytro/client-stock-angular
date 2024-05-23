import { AbstractControl, ValidationErrors } from '@angular/forms';

export class Validator {
  static emailValidator(control: AbstractControl): ValidationErrors | null {
    const email = control.value as string;
    const domainPattern = /^[^@]+\@[^@]+\.[a-zA-Z]{2,}$/;
    const valid = domainPattern.test(email);
    return valid ? null : { invalidEmail: true };
  }
}
