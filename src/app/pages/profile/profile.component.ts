import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TotalBalanceService } from '../../core/UI/components/total-balance/total-balance.service';
import { AuthService } from '../../service/auth.service';
import { UserService } from '../../service/user.service';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { FeedbackComponent } from './components/feedback/feedback.component';
import { IconComponent } from '../../core/UI/components/icon/icon.component';
import { GeneralComponent } from './components/general/general.component';
import { SystemComponent } from './components/system/system.component';


const UI_MODULES = [
  GeneralComponent,
  SystemComponent,
  FeedbackComponent,
  IconComponent
];

const MATERIAL_MODULES = [
  MatSlideToggleModule, 
  FormsModule, 
  ReactiveFormsModule, 
  MatFormFieldModule, 
  MatInputModule,
  MatButtonModule
];

@Component({
  selector: 'pgz-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [...UI_MODULES, ...MATERIAL_MODULES],
})
export class ProfileComponent implements OnInit {
  public userEmail: string; 
  public isAuthorizedUser: boolean = false;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
  ) { }

  public ngOnInit(): void {
    this.userService.getUser().subscribe(user => {
      if(user && user.email) {
        this.userEmail = user.email;
        this.isAuthorizedUser = true;
      } else {
        this.userEmail = 'User not registered';
        this.isAuthorizedUser = false;
      }
    });

  
  }

  public logout(): void {
    this.authService.logOut();
  }

  public login(): void {
    this.router.navigate(['/auth']);
  }
}
