import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'pgz-input-recovery-code',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './input-recovery-code.component.html',
  styleUrls: ['./input-recovery-code.component.scss', '../../../auth.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InputRecoveryCodeComponent {
  codeDigits: string[] = ['', '', '', '', '', ''];
  errorMessage: string | null = null;

  onDigitInput(event: any, index: number): void {
    const input = event.target;
    const value = input.value;

    if (value.length === 1 && /\d/.test(value)) {
      if (index < this.codeDigits.length - 1) {
        // Переходить на наступне поле
        const nextInput = input.nextElementSibling;
        if (nextInput) {
          nextInput.focus();
        }
      }
    } else {
      this.codeDigits[index] = ''; // Якщо не цифра, очищає поле
    }
  }

  // Метод для обробки видалення цифри і перемикання на попереднє поле
  onBackspace(event: any, index: number): void {
    if (event.key === 'Backspace' && !this.codeDigits[index] && index > 0) {
      const previousInput = event.target.previousElementSibling;
      if (previousInput) {
        previousInput.focus();
      }
    }
  }

  // Перевірка на заповненість всіх полів
  isCodeComplete(): boolean {
    return this.codeDigits.every(digit => digit !== '');
  }

  // Обробка відправки форми
  onSubmit(): void {
    if (this.isCodeComplete()) {
      const recoveryCode = this.codeDigits.join('');
      console.log('Recovery Code:', recoveryCode);
      // Логіка відправки коду на сервер
    } else {
      this.errorMessage = 'Please complete all fields.';
    }
  }
}
