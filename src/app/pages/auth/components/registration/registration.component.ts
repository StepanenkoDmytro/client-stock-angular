import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../../service/auth.service';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AppRoutes } from '../../../../app.routes';


const MATERIAL_MODULES = [
  MatFormFieldModule,
  ReactiveFormsModule,
  MatInputModule,
  MatButtonModule,
];

@Component({
  selector: 'pgz-registration',
  standalone: true,
  imports: [...MATERIAL_MODULES, RouterModule],
  templateUrl: './registration.component.html',
  styleUrl: './registration.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegistrationComponent {
  public readonly AppRoutes = AppRoutes;
  //TODO: Validate email, password equality, disabled submit if password not equal
  public form: FormGroup;
  public nameCtrl: FormControl<string> = new FormControl<string>('', [Validators.required]);
  public passwordCtrl: FormControl<string> = new FormControl<string>('', [Validators.required]);
  public repeatPasswordCtrl: FormControl<string> = new FormControl<string>('', [Validators.required]);

  public invalidPasswordErrorMessage: string;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private router: Router
  ) { }

  public ngOnInit(): void {
    this.form = this.formBuilder.group({
      'email': this.nameCtrl,
      'password': this.passwordCtrl,
      // 'repeatPassword': this.repeatPasswordCtrl,
    })
  }

  public async handleSubmit(): Promise<void> {
    let isSuccess: boolean = false; 
    if (this.repeatPasswordCtrl.value !== this.passwordCtrl.value) {
      this.invalidPasswordErrorMessage = 'Passwords should be same';
      //TODO: rework to Validator
      this.form.setErrors({customError: true});
      
      return;
    }

    this.invalidPasswordErrorMessage = '';
    try {
      isSuccess = await firstValueFrom(this.authService.register(this.form.getRawValue()));
    } catch (e) {
      this.showLoginError();
    }

    if(isSuccess) {
      this.router.navigate(['/spending']);
      console.log('TODO: create some ');
    } else {
      console.log('TODO: mat error');
    }
  }

  private showLoginError(): void {
    console.log('Error :D')
  }
}
