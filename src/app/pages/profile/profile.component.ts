import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../service/auth.service';
import { UserService } from '../../service/user.service';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { IconComponent } from '../../core/UI/components/icon/icon.component';
import { SystemComponent } from './components/system/system.component';
import { IUser, UserMode } from '../../model/User';
import { PrevRouteComponent } from '../../core/UI/components/prev-route/prev-route.component';


const UI_MODULES = [
  SystemComponent,
  IconComponent,
  PrevRouteComponent
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
  public isStageMode: boolean = true;
  public currentMode: UserMode = UserMode.Stage;

  public user: IUser | null = null;
  public userName: string = 'User';
  public userEmail: string; 
  public isConfirmaEmail: boolean = true;
  public isAuthorizedUser: boolean = false;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  public ngOnInit(): void {
    this.userService.getUser().subscribe(user => {
      // debugger;
      this.user = user;
      if(!user.name) {
        this.userName = this.userName + `${user.id}`;
      }
      // this.userName = user?.name;
      // this.isConfirmaEmail = user?.isConfirmaEmail;
      this.currentMode = user?.mode;
      this.isStageMode = this.currentMode === UserMode.Stage;

      if(user && user.email) {
        this.userEmail = user.email;
        this.isAuthorizedUser = true;
        
      } else {
        this.userEmail = 'User not registered';
        this.isAuthorizedUser = false;
      }
    });
  }

  public onToggleChange(): void {
    const newMode = this.isStageMode ? UserMode.Stage : UserMode.Dev;
    this.changeMode(newMode);
  }

  public changeMode(newMode: UserMode): void {
    const updatedUser: IUser = { ...this.user, mode: newMode };
    this.userService.saveIUser(updatedUser);
    this.cdr.detectChanges();
  }

  public logout(): void {
    this.authService.logOut();
  }

  public login(): void {
    this.router.navigate(['/auth']);
  }

  public registration(): void {
    this.router.navigate(['/auth/registration']);
  }

  public changeProfileSettings(): void {
    this.router.navigate(['/profile/profile-settings']);
  }

  public changeMonthlyBudget(): void {
    this.router.navigate(['/profile/monthly-budget']);
  }
}
