import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { IconComponent } from '../../../../../core/UI/components/icon/icon.component';

@Component({
  selector: 'pgz-popup-settings-list',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './popup-settings-list.component.html',
  styleUrl: './popup-settings-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PopupSettingsListComponent {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { items: string[], activeItem: string },
    private dialogRef: MatDialogRef<PopupSettingsListComponent>
  ) {}

  public selectSetting(setting: string): void {
    this.dialogRef.close(setting);
  }
}
