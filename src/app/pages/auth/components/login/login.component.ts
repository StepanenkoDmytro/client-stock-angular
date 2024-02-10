import { ChangeDetectionStrategy, Component, NgZone, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../../service/auth.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Router, RouterModule } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { GoogleBtnComponent } from '../google-btn/google-btn.component';
import { MatIconModule } from '@angular/material/icon';
import { FacebookBtnComponent } from '../facebook-btn/facebook-btn.component';


const UI_COMPONENTS = [
  GoogleBtnComponent,
  FacebookBtnComponent
];

const MATERIAL_MODULES = [
  MatFormFieldModule,
  ReactiveFormsModule,
  MatInputModule,
  MatButtonModule,
  MatIconModule
];

@Component({
  selector: 'pgz-login',
  standalone: true,
  imports: [...UI_COMPONENTS, ...MATERIAL_MODULES, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements OnInit {

  public form: FormGroup;
  public nameCtrl: FormControl<string> = new FormControl<string>('', [Validators.required]);
  public passwordCtrl: FormControl<string> = new FormControl<string>('', [Validators.required]);

  public passwordHide: boolean = true;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private router: Router,
    private ngZone: NgZone
  ) { }

  public ngOnInit(): void {
    this.form = this.formBuilder.group({
      'email': this.nameCtrl,
      'password': this.passwordCtrl,
    });
  }


  public async handleSubmit(): Promise<void> {
    let isSuccess: boolean = false; 
    try {
      isSuccess = await firstValueFrom(this.authService.login(this.form.getRawValue()));
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

  public async loginWithGoogle(googleResponse: any): Promise<void> {
    console.log(googleResponse);
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

  private showLoginError(): void {
    console.log('Error :D')
  }
}
