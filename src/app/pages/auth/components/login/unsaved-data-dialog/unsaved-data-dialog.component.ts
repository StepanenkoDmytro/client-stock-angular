import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'pgz-unsaved-data-dialog',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './unsaved-data-dialog.component.html',
  styleUrl: './unsaved-data-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UnsavedDataDialogComponent {
  
  constructor(
    public dialogRef: MatDialogRef<UnsavedDataDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: string
  ) {}

  onSave(): void {
    this.dialogRef.close('save');
  }

  onDelete(): void {
    this.dialogRef.close('delete');
  }
}
