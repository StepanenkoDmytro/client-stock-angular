import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, FormBuilder, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { BehaviorSubject } from 'rxjs';


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
  constructor(
    private formBuilder: FormBuilder
  ) {}
  public ngOnInit(): void {
    this.form = this.formBuilder.group({
      'password': this.passwordCtrl,
      'repeatPasswordCtrl': this.repeatPasswordCtrl
    });

    this.form.valueChanges.subscribe((formValues) => {
      const password = this.passwordCtrl.value;
      const repeatPassword = this.repeatPasswordCtrl.value;
      console.log(password, repeatPassword)
      if (password.length > 0 && repeatPassword.length > 0) {
        const isValid = password === repeatPassword;
        console.log(password, repeatPassword)
        this.isValidityPassword.next(isValid);
      }
    });
  }
  public form: FormGroup;
  public passwordCtrl: FormControl<string> = new FormControl<string>('', [Validators.required]);
  public repeatPasswordCtrl: FormControl<string> = new FormControl<string>('', [Validators.required]);

  public invalidPasswordErrorMessage: string = '';

  public passwordHide: boolean = true;
  public repeatPasswordHide: boolean = true;
  public showPasswordError: boolean = false;

  public isValidityPassword: BehaviorSubject<boolean> = new BehaviorSubject(false);

  public handleSubmit(): void {
    console.log('q');
  }

  public checkPasswordValidity(): void {
    this.showPasswordError = this.passwordCtrl.invalid || this.repeatPasswordCtrl.invalid;
  }
}
