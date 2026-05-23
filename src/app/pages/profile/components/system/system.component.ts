import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { PopupSettingsListComponent } from '../ui-settings/popup-settings-list/popup-settings-list.component';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject } from 'rxjs';
import { DarkLightModeService } from '../../../../service/dark-light-mode.service';
import { Theme } from '../../model/Theme';
import { SettingsCardComponent } from '../../../../core/UI/components/settings-card/settings-card.component';
import { SettingsRowComponent } from '../../../../core/UI/components/settings-row/settings-row.component';

@Component({
  selector: 'pgz-system',
  standalone: true,
  imports: [SettingsCardComponent, SettingsRowComponent, PopupSettingsListComponent],
  templateUrl: './system.component.html',
  styleUrl: './system.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemComponent implements OnInit {
  public isDarkMode: BehaviorSubject<string> = new BehaviorSubject('dark');

  /** Display value rendered next to the Theme row label. */
  public themeValue: string = 'Dark';

  /** Language is currently disabled (CC-4 will lift the gate). EN is the only locale. */
  public readonly languageValue: string = 'EN';

  constructor(
    private darkLightModeService: DarkLightModeService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
  ) { }

  public ngOnInit(): void {
    this.getSavedThemeMode();
    this.isDarkMode.subscribe((mode) => {
      this.darkLightModeService.set(mode);
      this.themeValue = this.formatThemeValue(mode);
      this.cdr.markForCheck();
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

  private formatThemeValue(mode: string): string {
    if (!mode) {
      return 'Auto';
    }
    return mode.charAt(0).toUpperCase() + mode.slice(1).toLowerCase();
  }
}
