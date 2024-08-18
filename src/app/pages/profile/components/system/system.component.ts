import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { PopupSettingsListComponent } from '../ui-settings/popup-settings-list/popup-settings-list.component';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject } from 'rxjs';
import { DarkLightModeService } from '../../../../service/dark-light-mode.service';
import { Theme } from '../../model/Theme';

@Component({
  selector: 'pgz-system',
  standalone: true,
  imports: [PopupSettingsListComponent],
  templateUrl: './system.component.html',
  styleUrl: '../../profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SystemComponent implements OnInit {
  public isDarkMode: BehaviorSubject<string> = new BehaviorSubject('dark');

  constructor(
    private darkLightModeService: DarkLightModeService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
  ) { }

  public ngOnInit(): void {
    this.getSavedThemeMode();
    this.isDarkMode.subscribe((mode) => {
      this.darkLightModeService.set(mode);
    });
  }
  

  public changeLanguage(): void {
    const items = ['Item 1', 'Item 2', 'Item 3'];

    this.dialog.open(PopupSettingsListComponent, {
      data: { items },
    });
  }

  public changeTheme(): void {
    const items = Object.values(Theme);
    const activeItem = this.isDarkMode.getValue();

    const dialogRef = this.dialog.open(PopupSettingsListComponent, {
      maxWidth: '300px',
      maxHeight: '500px',
      data: { items, activeItem },
    });

    dialogRef.afterClosed().subscribe((result: string) => {
      if (result) {
        this.isDarkMode.next(result);
        this.cdr.detectChanges();
      }
    });
  }

  private getSavedThemeMode(): void {
    const savedMode = this.darkLightModeService.activeTheme;
    this.isDarkMode.next(savedMode);
  }
}
