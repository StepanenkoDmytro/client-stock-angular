import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { DarkLightModeService } from '../../service/dark-light-mode.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TotalBalanceService } from '../../core/UI/components/total-balance/total-balance.service';
import { AuthService } from '../../service/auth.service';
import { UserService } from '../../service/user.service';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { GeneralComponent } from './general/general.component';
import { SystemComponent } from './system/system.component';
import { FeedbackComponent } from './feedback/feedback.component';
import { IconComponent } from '../../core/UI/components/icon/icon.component';


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
  
  public isDarkMode: FormControl<boolean> = new FormControl<boolean>(true);
  public monthlyBudget: number;

  constructor(
    private darkLightModeService: DarkLightModeService,
    private totalBalanceService: TotalBalanceService,
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

    this.getThemeMode();
  }

  public saveMonthlyBudget(): void {
    this.totalBalanceService.saveMonthlyBudget(this.monthlyBudget);
  }

  public logout(): void {
    this.authService.logOut();
  }

  public login(): void {
    this.router.navigate(['/auth']);
  }

  private getThemeMode(): void {
    const savedMode = this.darkLightModeService.activeTheme === 'dark';
    this.isDarkMode.setValue(savedMode);
    this.isDarkMode.valueChanges.subscribe((darkMode) => {
        const mode = darkMode ? 'dark' : 'light';
        this.darkLightModeService.set(mode);
    });
  }
}
