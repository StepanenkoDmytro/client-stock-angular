import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { DarkLightModeService } from '../../service/dark-light-mode.service';


@Component({
  selector: 'pgz-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatSlideToggleModule, FormsModule, ReactiveFormsModule],
})
export class ProfileComponent implements OnInit {
  
  public isDarkMode: FormControl<boolean> = new FormControl<boolean>(true);

  constructor(
    private darkLightModeService: DarkLightModeService
  ) { }

  public ngOnInit(): void {
    this.isDarkMode.valueChanges.subscribe((darkMode) => {
        const mode = darkMode ? 'dark' : 'light';
        this.darkLightModeService.set(mode);
    });
  }
}
