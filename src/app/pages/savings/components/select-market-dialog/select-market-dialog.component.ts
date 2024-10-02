import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogActions, MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { MARKETS } from '../../savings.routes';


const MATERIAL_UI = [
  MatButtonModule,
  MatDialogActions,
  MatDialogClose,
];

@Component({
  selector: 'pgz-select-market-dialog',
  standalone: true,
  imports: [...MATERIAL_UI],
  templateUrl: './select-market-dialog.component.html',
  styleUrl: './select-market-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectMarketDialogComponent {
  readonly dialogRef = inject(MatDialogRef<SelectMarketDialogComponent>);
  public marketsList: string[] = MARKETS;

  public onNoClick(): void {
    this.dialogRef.close();
  }

  public selectAndClose(result: string): void {
    this.dialogRef.close(result);
  }
}
