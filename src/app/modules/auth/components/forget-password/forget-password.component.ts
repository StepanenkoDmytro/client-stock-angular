import { Component } from '@angular/core';
import { AuthService } from '../../auth.service';
import { FormControl, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-forget-password',
  templateUrl: './forget-password.component.html',
  styleUrls: ['./forget-password.component.scss']
})
export class ForgetPasswordComponent {

  public emailCtrl: FormControl<string> = new FormControl<string>('', [Validators.required, Validators.email]);
  public isEmailSent: boolean = false;

  constructor(
    private readonly authService: AuthService,
  ) { }

  public async sendEmailToRestorePassword(): Promise<void> {
    try {
      await firstValueFrom(this.authService.restorePassword());
      this.isEmailSent = true;
    } catch (e) {
      this.showError();
    }
  }

  private showError(): void {
    console.log('Error');
  }

}
