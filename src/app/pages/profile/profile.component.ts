import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { DarkLightModeService } from '../../service/dark-light-mode.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ExpenseService } from '../../service/expense.service';


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
    private expenseService: ExpenseService
  ) { }

  public ngOnInit(): void {
    this.isDarkMode.valueChanges.subscribe((darkMode) => {
        const mode = darkMode ? 'dark' : 'light';
        this.darkLightModeService.set(mode);
    });
  }

  public saveMonthlyBudget() {
    this.expenseService.saveMonthlyBudget(this.monthlyBudget);
  }
}
