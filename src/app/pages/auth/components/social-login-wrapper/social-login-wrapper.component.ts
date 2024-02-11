import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { FacebookBtnComponent } from '../facebook-btn/facebook-btn.component';
import { GoogleBtnComponent } from '../google-btn/google-btn.component';


const UI_COMPONENTS = [
  GoogleBtnComponent,
  FacebookBtnComponent,
];

@Component({
  selector: 'pgz-social-login-wrapper',
  standalone: true,
  imports: [...UI_COMPONENTS],
  templateUrl: './social-login-wrapper.component.html',
  styleUrl: './social-login-wrapper.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SocialLoginWrapperComponent {

  @Output()
  public googleResponse = new EventEmitter<any>();

  public loginWithGoogle(event: any) {
    this.googleResponse.emit(event);
  }
}
