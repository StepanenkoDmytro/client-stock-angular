import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../../service/auth.service';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AppRoutes } from '../../../../app.routes';
import { MatIconModule } from '@angular/material/icon';
import { Validator } from '../../validator/Validator';
import { GoogleBtnComponent } from '../social-login-wrapper/google-btn/google-btn.component';


const MATERIAL_MODULES = [
  MatFormFieldModule,
  ReactiveFormsModule,
  MatInputModule,
  MatButtonModule,
  MatIconModule
];

@Component({
  selector: 'pgz-registration',
  standalone: true,
  imports: [GoogleBtnComponent, ...MATERIAL_MODULES, RouterModule],
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss', '../auth.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegistrationComponent {
  public readonly AppRoutes = AppRoutes;

  public form: FormGroup;
  public emailCtrl: FormControl<string> = new FormControl<string>('', [Validators.required, Validator.emailValidator]);
  public passwordCtrl: FormControl<string> = new FormControl<string>('', [Validators.required]);
  public repeatPasswordCtrl: FormControl<string> = new FormControl<string>('', [Validators.required]);

  public invalidPasswordErrorMessage: string;
  public passwordHide: boolean = true;
  public repeatPasswordHide: boolean = true;
  public showEmailError: boolean = false;
  public showPasswordError: boolean = false;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private ngZone: NgZone,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  public ngOnInit(): void {
    this.form = this.formBuilder.group({
      'email': this.emailCtrl,
      'password': this.passwordCtrl,
    })
  }

  public async handleSubmit(): Promise<void> {
    let isSuccess: boolean = false; 

    if (this.repeatPasswordCtrl.value !== this.passwordCtrl.value) {
      this.invalidPasswordErrorMessage = 'Passwords should be same';
      this.cdr.detectChanges();
      return;
    }

    this.invalidPasswordErrorMessage = '';
    try {
      isSuccess = await firstValueFrom(this.authService.register(this.form.getRawValue()));
    } catch (e) {
      this.showLoginError();
    }

    if(isSuccess) {
      this.router.navigate(['/auth']);
    } else {
      console.log('TODO: mat error');
    }
  }

  public async loginWithGoogle(googleResponse: any): Promise<void> {
    let isSuccess: boolean = false; 
    try {
      isSuccess = await firstValueFrom(this.authService.loginWithGoogle(googleResponse));
    } catch (e) {
      this.showLoginError();
    }

    if(isSuccess) {
      this.ngZone.run(() => {
        this.router.navigate(['/spending']);
        console.log('TODO: create some ');
      });
    } else {
      console.log('TODO: mat error');
    }
  }

  public checkEmailValidity(): void {
    this.showEmailError = this.emailCtrl.invalid;
  }

  public checkPasswordValidity(): void {
    this.showPasswordError = this.passwordCtrl.invalid || this.repeatPasswordCtrl.invalid;
  }

  private showLoginError(): void {
    console.log('Error :D')
  }
}
