import { ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output } from '@angular/core';


declare var google: any;

@Component({
  selector: 'pgz-google-btn',
  standalone: true,
  imports: [],
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
      callback: (response: any) => {
        const token = {
          "token": response['credential']
        }
        this.googleResponse.emit(token);
      }
    });

    const options = {
      theme: 'filled_blue',
      size: 'large',
      shape: 'rectangle',
      width: 350
    };
    const parentElement = document.getElementById('google-btn');

    google.accounts.id.renderButton(parentElement, options);
  }
  
}
