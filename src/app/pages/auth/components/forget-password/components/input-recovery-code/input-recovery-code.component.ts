import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { EmailStateService } from '../../service/email-state.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../../../service/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'pgz-input-recovery-code',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, MatButtonModule, CommonModule],
  templateUrl: './input-recovery-code.component.html',
  styleUrls: ['./input-recovery-code.component.scss', '../../../auth.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InputRecoveryCodeComponent implements OnInit {
  public userEmail: string = '';
  public codeDigits: string[] = ['', '', '', '', '', ''];
  public errorMessage: string | null = null;

  private recoveryCode: string = '';
  constructor(
    private authService: AuthService,
    private emailStateService: EmailStateService,
    private router: Router
  ) {}

  public ngOnInit(): void {
    this.recoveryCode = this.emailStateService.recoveryCode;
    this.userEmail = this.emailStateService.userEmail;
  }

  public resendCodeToEmail(): void {
    if(!this.userEmail) {
      return;
    }

    this.authService.sendRecoveryCode(this.userEmail);
  }

  public onDigitInput(event: any, index: number): void {
    const input = event.target;
    const value = input.value;

    if (value.length === 1 && /\d/.test(value)) {
      if (index < this.codeDigits.length - 1) {
        const nextInput = input.nextElementSibling;
        if (nextInput) {
          nextInput.focus();
        }
      }
    } else {
      this.codeDigits[index] = '';
    }
  }

  public onBackspace(event: any, index: number): void {
    if (event.key === 'Backspace' && !this.codeDigits[index] && index > 0) {
      const previousInput = event.target.previousElementSibling;
      if (previousInput) {
        previousInput.focus();
      }
    }
  }

  public isCodeComplete(): boolean {
    return this.codeDigits.every(digit => digit !== '');
  }

  public onSubmit(): void {
    if (this.isCodeComplete()) {
      const recoveryCode = this.codeDigits.join('');
      if(recoveryCode !== this.recoveryCode) {
        this.errorMessage = 'Invalid code. Please try again.';
        return;
      }

      this.router.navigate(['/auth/change-password']);
    } else {
      this.errorMessage = 'Please complete all fields.';
    }
  }
}
