import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AuthService } from '../../../../service/auth.service';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Router, RouterModule } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { EmailStateService } from './service/email-state.service';


const MATERIAL_MODULES = [
  MatFormFieldModule,
  MatInputModule,
  MatButtonModule,
  ReactiveFormsModule
];

@Component({
  selector: 'pgz-forget-password',
  standalone: true,
  imports: [...MATERIAL_MODULES, RouterModule],
  templateUrl: './forget-password.component.html',
  styleUrls: ['./forget-password.component.scss', '../auth.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForgetPasswordComponent {
  public emailCtrl: FormControl<string> = new FormControl<string>('', [Validators.required, Validators.email]);
  public isEmailSent: boolean = false;

  constructor(
    private readonly authService: AuthService,
    private emailStateService: EmailStateService,
    private router: Router
  ) { }

  public async sendEmailToRestorePassword(): Promise<void> {
    //TODO: sendRecoveryCode handle diff statuses
    try {
      const recoveryCode: string = await lastValueFrom(this.authService.sendRecoveryCode(this.emailCtrl.value));
      this.emailStateService.recoveryCode = recoveryCode;
      this.emailStateService.userEmail = this.emailCtrl.value;
      this.router.navigate(['auth/input-recovery-code']);
    } catch (e) {
      this.showError();
    }
  }

  private showError(): void {
    console.log('Error');
  }
}
