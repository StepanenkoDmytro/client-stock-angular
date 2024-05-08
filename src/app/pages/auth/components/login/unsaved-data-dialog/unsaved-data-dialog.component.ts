import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'pgz-unsaved-data-dialog',
  standalone: true,
  imports: [],
  templateUrl: './unsaved-data-dialog.component.html',
  styleUrl: './unsaved-data-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UnsavedDataDialogComponent {
  
  constructor(
    public dialogRef: MatDialogRef<UnsavedDataDialogComponent>,
  ) {}

  onSave(): void {
    this.dialogRef.close('save');
  }

  onDelete(): void {
    this.dialogRef.close('delete');
  }
}
