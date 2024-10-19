import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, FormBuilder, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { BehaviorSubject, lastValueFrom } from 'rxjs';
import { AuthService } from '../../../../../../service/auth.service';
import { EmailStateService } from '../../service/email-state.service';
import { Router } from '@angular/router';


const MATERIAL_MODULES = [
  MatFormFieldModule,
  ReactiveFormsModule,
  MatInputModule,
  MatButtonModule,
  MatIconModule
];

@Component({
  selector: 'pgz-change-password',
  standalone: true,
  imports: [...MATERIAL_MODULES, FormsModule],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss', '../../../auth.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChangePasswordComponent implements OnInit {
  public form: FormGroup;
  public passwordCtrl: FormControl<string> = new FormControl<string>('', [Validators.required]);
  public repeatPasswordCtrl: FormControl<string> = new FormControl<string>('', [Validators.required]);

  public invalidPasswordErrorMessage: string = '';

  public passwordHide: boolean = true;
  public repeatPasswordHide: boolean = true;
  public showPasswordError: boolean = false;

  public isValidityPassword: BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private emailStateService: EmailStateService,
    private roter: Router
  ) {}

  public ngOnInit(): void {
    this.form = this.formBuilder.group({
      'password': this.passwordCtrl,
      'repeatPasswordCtrl': this.repeatPasswordCtrl
    });

    this.form.valueChanges.subscribe(() => {
      const password = this.passwordCtrl.value;
      const repeatPassword = this.repeatPasswordCtrl.value;
      if (password.length > 0 && repeatPassword.length > 0) {
        const isValid = password === repeatPassword;
        console.log(password, repeatPassword)
        this.isValidityPassword.next(isValid);
      }
    });
  }
  
  public async handleSubmit(): Promise<void> {
    const recoveryCode = this.emailStateService.recoveryCode;
    const email = this.emailStateService.userEmail;
    const newPassword = this.passwordCtrl.value;

    await lastValueFrom(this.authService.changePassword(recoveryCode, email, newPassword));
    this.roter.navigate(['auth/login']);
  }

  public checkPasswordValidity(): void {
    this.showPasswordError = this.passwordCtrl.invalid || this.repeatPasswordCtrl.invalid;
  }
}
