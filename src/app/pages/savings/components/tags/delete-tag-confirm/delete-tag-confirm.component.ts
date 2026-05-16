import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Data passed into the bottom-sheet via MAT_BOTTOM_SHEET_DATA.
 *
 *   tagName       — display name in the title.
 *   childrenCount — if > 0, render the blocking variant ("Has N sub-tags...
 *                   Delete or move them first") with only a Cancel button.
 *   usageCount    — if > 0, show "Used in N savings." subtitle. Once the
 *                   holdings store lands (PR4) this will become meaningful;
 *                   PR2 always passes 0 here.
 */
export interface DeleteTagConfirmData {
  tagName: string;
  childrenCount: number;
  usageCount: number;
}

export type DeleteTagConfirmResult = 'delete' | 'cancel';

@Component({
  selector: 'pgz-delete-tag-confirm',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './delete-tag-confirm.component.html',
  styleUrl: './delete-tag-confirm.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteTagConfirmComponent {
  public readonly hasChildren: boolean;

  constructor(
    private readonly bottomSheetRef: MatBottomSheetRef<
      DeleteTagConfirmComponent,
      DeleteTagConfirmResult
    >,
    @Inject(MAT_BOTTOM_SHEET_DATA) public readonly data: DeleteTagConfirmData,
  ) {
    this.hasChildren = data.childrenCount > 0;
  }

  public onCancel(): void {
    this.bottomSheetRef.dismiss('cancel');
  }

  public onDelete(): void {
    this.bottomSheetRef.dismiss('delete');
  }
}
