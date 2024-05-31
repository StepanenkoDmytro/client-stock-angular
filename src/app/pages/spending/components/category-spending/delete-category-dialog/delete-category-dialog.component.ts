import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'pgz-delete-category-dialog',
  standalone: true,
  imports: [MatIcon],
  templateUrl: './delete-category-dialog.component.html',
  styleUrl: './delete-category-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeleteCategoryDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<DeleteCategoryDialogComponent>,
  ) { }

  public onSave(): void {
    this.dialogRef.close('save');
  }

  public onDelete(): void {
    this.dialogRef.close('delete');
  }
}
