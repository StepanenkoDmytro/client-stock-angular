import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { DemoDataService } from '../../../../core/services/demo-data.service';
import {
  DemoActionsSheetComponent,
  DemoActionsSheetData,
  DemoActionsSheetResult,
} from './demo-actions-sheet.component';

/**
 * Persistent amber demo banner per
 * `docs/notes/2026-05-savings-empty-states-ladder.md` §5.2 + frame F3
 * of `design/savings/07-empty-states.svg`. Stays sticky at the top of
 * the app shell as long as any entity with {@code isDemo: true} exists
 * across the holdings / accounts / tags stores. Inserts into
 * {@code AppComponent} so it surfaces on every page — the user can't
 * accidentally "forget" they have demo data loaded while bouncing
 * between Savings / Spending / Stats.
 *
 * <p>«Clear demo →» CTA opens {@link DemoActionsSheetComponent} for a
 * single-step confirm (task §8 Q3); on confirm dispatches
 * {@link DemoDataService#clear} + a snackbar acknowledging the removal.
 */
@Component({
  selector: 'pgz-demo-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './demo-banner.component.html',
  styleUrl: './demo-banner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoBannerComponent {
  private readonly demoData = inject(DemoDataService);
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly snackBar = inject(MatSnackBar);

  public readonly isDemoActive = this.demoData.isDemoActive;
  public readonly demoItemsCount = this.demoData.demoItemsCount;

  public async onClear(): Promise<void> {
    const data: DemoActionsSheetData = {
      mode: 'active',
      summary: `${this.demoItemsCount()} demo items will be removed`,
    };
    const ref = this.bottomSheet.open<
      DemoActionsSheetComponent,
      DemoActionsSheetData,
      DemoActionsSheetResult
    >(DemoActionsSheetComponent, { data });
    const result = await firstValueFrom(ref.afterDismissed());
    if (result === 'clear') {
      await this.demoData.clear();
      this.snackBar.open(
        'Demo data cleared · Real holdings kept',
        undefined,
        { duration: 2500 },
      );
    }
  }
}
