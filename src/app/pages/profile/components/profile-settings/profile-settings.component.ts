import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PrevRouteComponent } from '../../../../core/UI/components/prev-route/prev-route.component';
import { Router } from '@angular/router';
import { FormInputComponent } from '../../../../core/UI/components/form-input/form-input.component';
import { MatDialog } from '@angular/material/dialog';
import { PopupSettingsListComponent } from '../ui-settings/popup-settings-list/popup-settings-list.component';

@Component({
  selector: 'pgz-profile-settings',
  standalone: true,
  imports: [PrevRouteComponent, FormInputComponent],
  templateUrl: './profile-settings.component.html',
  styleUrls: ['./profile-settings.component.scss', '../settings.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileSettingsComponent {

  constructor(
    private router: Router,
    private dialog: MatDialog,
  ) { }

  public prevRoute(): void {
    this.router.navigate(['/profile']);
  }

  public changeCurrency(): void {
    const items = ['Item 1', 'Item 2', 'Item 3'];

    this.dialog.open(PopupSettingsListComponent, {
      data: { items },
    });
  }
}
