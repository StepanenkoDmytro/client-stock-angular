import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../../service/auth.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { RouterModule } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

const MATERIAL_MODULES = [
  MatFormFieldModule,
  ReactiveFormsModule,
  MatInputModule,
  MatButtonModule
];

@Component({
  selector: 'pgz-login',
  standalone: true,
  imports: [...MATERIAL_MODULES, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements OnInit {

  public form: FormGroup;
  public nameCtrl: FormControl<string> = new FormControl<string>('', [Validators.required]);
  public passwordCtrl: FormControl<string> = new FormControl<string>('', [Validators.required]);

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
  ) { }

  public ngOnInit(): void {
    this.form = this.formBuilder.group({
      'email': this.nameCtrl,
      'password': this.passwordCtrl,
    })
  }

  public async handleSubmit(): Promise<void> {
    try {
      await firstValueFrom(this.authService.login(this.form.getRawValue()));
    } catch (e) {
      this.showLoginError();
    }
  }

  private showLoginError(): void {
    console.log('Error :D')
  }
}
