import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TotalBalanceService } from '../../core/UI/components/total-balance/total-balance.service';
import { AuthService } from '../../service/auth.service';
import { UserService } from '../../service/user.service';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { IconComponent } from '../../core/UI/components/icon/icon.component';
import { SystemComponent } from './components/system/system.component';
import { IUser, UserMode } from '../../model/User';
import { MatDialog } from '@angular/material/dialog';
import { PopupMonthlyBudgetComponent } from './components/ui-settings/popup-monthly-budget/popup-monthly-budget.component';


const UI_MODULES = [
  SystemComponent,
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
  public userMode: UserMode = UserMode.Stage;
  public isChecked: boolean = false;

  public user: IUser | null = null;
  public userEmail: string; 
  public isAuthorizedUser: boolean = false;

  public monthlyBudget: number = 0;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private totalBalanceService: TotalBalanceService,
    private dialog: MatDialog,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  public ngOnInit(): void {
    this.userService.getUser().subscribe(user => {
      this.user = user;
      this.userMode = user.mode;
      if(user && user.email && user.mode) {
        this.userEmail = user.email;
        this.isAuthorizedUser = true;
        
      } else {
        this.userEmail = 'User not registered';
        this.isAuthorizedUser = false;
      }
    });
  }

  public onToggleChange(): void {
    const newMode = this.isChecked ? UserMode.Dev : UserMode.Stage;
    this.changeMode(newMode);
  }

  public changeMode(newMode: UserMode): void {
    if (this.userMode) {
      const updatedUser: IUser = { ...this.user, mode: newMode };
      this.userService.saveIUser(updatedUser);
      this.cdr.detectChanges();
    }
  }

  public logout(): void {
    this.authService.logOut();
  }

  public login(): void {
    this.router.navigate(['/auth']);
  }

  public changeMonthlyBudget(): void {
    const currentBudget = this.monthlyBudget.toString();

    const dialogRef = this.dialog.open(PopupMonthlyBudgetComponent, {
      maxWidth: '300px',
      maxHeight: '500px',
      data: { currentBudget },
    });

    dialogRef.afterClosed().subscribe((result: string) => {
      const monthlyBudget = parseInt(result);
      this.totalBalanceService.saveMonthlyBudget(monthlyBudget);
      this.cdr.detectChanges();
    });
  }
}
