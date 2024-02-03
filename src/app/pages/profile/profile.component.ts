import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { DarkLightModeService } from '../../service/dark-light-mode.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TotalBalanceService } from '../../core/UI/components/total-balance/total-balance.service';
import { AuthService } from '../../service/auth.service';


@Component({
  selector: 'pgz-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatSlideToggleModule, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule],
})
export class ProfileComponent implements OnInit {
  
  public isDarkMode: FormControl<boolean> = new FormControl<boolean>(true);
  public monthlyBudget: number;

  constructor(
    private darkLightModeService: DarkLightModeService,
    private totalBalanceService: TotalBalanceService,
    private authService: AuthService,
  ) { }

  public ngOnInit(): void {
    const savedMode = this.darkLightModeService.activeTheme === 'dark';
    this.isDarkMode.setValue(savedMode);
    this.isDarkMode.valueChanges.subscribe((darkMode) => {
        const mode = darkMode ? 'dark' : 'light';
        this.darkLightModeService.set(mode);
    });
  }

  public saveMonthlyBudget(): void {
    this.totalBalanceService.saveMonthlyBudget(this.monthlyBudget);
  }

  public logout(): void {
    this.authService.logOut();
  }
}
