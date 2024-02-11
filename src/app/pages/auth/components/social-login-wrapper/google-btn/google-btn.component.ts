import { ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { IconComponent } from '../../../../../core/UI/components/icon/icon.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';


declare var google: any;

const createFakeGoogleWrapper = () => {
  const googleLoginWrapper = document.createElement("div");
  googleLoginWrapper.style.display = "none";
  googleLoginWrapper.classList.add("custom-google-button");
  document.body.appendChild(googleLoginWrapper);

  google.accounts.id.renderButton(googleLoginWrapper, {
    type: "icon",
    width: "200",
  });

  const googleLoginWrapperButton =
    googleLoginWrapper.querySelector("div[role=button]") as HTMLButtonElement;

  return {
    click: () => {
      googleLoginWrapperButton.click();
    },
  };
};

const UI_COMPONENTS = [
  IconComponent
];

@Component({
  selector: 'pgz-google-btn',
  standalone: true,
  imports: [...UI_COMPONENTS, MatIconModule, MatButtonModule],
  templateUrl: './google-btn.component.html',
  styleUrl: './google-btn.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GoogleBtnComponent implements OnInit {

  @Output()
  public googleResponse = new EventEmitter<any>();

  public ngOnInit(): void {
    google.accounts.id.initialize({
      client_id: '752613829972-39bssi3276q4s3v4r43n2t51847gsq6g.apps.googleusercontent.com',
      ux_mode: "popup",
      callback: (response: any) => {
        console.log(response);
        const token = {
          "token": response['credential']
        }
        this.googleResponse.emit(token);
      }
    });

    (window as any)['handleGoogleLogin'] = () => {
      createFakeGoogleWrapper().click();
    };
  }
}
