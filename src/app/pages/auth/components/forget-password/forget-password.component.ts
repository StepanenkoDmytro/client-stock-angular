import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AuthService } from '../../../../service/auth.service';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { RouterModule } from '@angular/router';
import { MatInputModule } from '@angular/material/input';


const MATERIAL_MODULES = [
  MatFormFieldModule,
  MatInputModule,
  ReactiveFormsModule
];

@Component({
  selector: 'pgz-forget-password',
  standalone: true,
  imports: [...MATERIAL_MODULES, RouterModule],
  templateUrl: './forget-password.component.html',
  styleUrl: './forget-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
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
