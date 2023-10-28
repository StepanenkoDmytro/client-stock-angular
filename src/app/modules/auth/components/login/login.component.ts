import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../auth.service';
import { first, firstValueFrom } from 'rxjs';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
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
      await firstValueFrom(this.authService.loginOrRegister(this.form.getRawValue()));
    } catch (e) {
      this.showLoginError();
    }
  }

  private showLoginError(): void {
    console.log('Error :D')
  }
}
