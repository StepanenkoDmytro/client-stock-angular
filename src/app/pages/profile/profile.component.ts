import { OverlayContainer } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { DarkLightModeService } from '../../service/dark-light-mode.service';
import { Subscription } from 'rxjs';



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
  private subscription: Subscription;

  constructor(
    private overlay:  OverlayContainer,
    private darkLightModeService: DarkLightModeService
  ) { }

  public ngOnInit(): void {
    const isFirstVisit = this.darkLightModeService.mode === null;
    if(isFirstVisit) {
      this.darkLightModeService.set('light');
    } else {
      this.darkLightModeService.set(this.darkLightModeService.mode);
    }
    
    
    this.isDarkMode.valueChanges.subscribe((darkMode) => {
        console.log('init');
        const mode = darkMode ? 'dark' : 'light';
        this.darkLightModeService.set(mode);
    });
  }
}
