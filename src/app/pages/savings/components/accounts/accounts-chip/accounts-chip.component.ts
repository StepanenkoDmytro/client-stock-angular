import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  MatBottomSheet,
  MatBottomSheetModule,
} from '@angular/material/bottom-sheet';
import { Store } from '@ngrx/store';
import { AccountsService } from '../../../service/accounts.service';
import {
  selectAccountsList,
  selectStaleAccountsCount,
} from '../../../store/accounts.selectors';
import { AccountsSheetComponent } from '../accounts-sheet/accounts-sheet.component';

/**
 * Header chip "🏦 N accounts" — entry point to
 * {@link AccountsSheetComponent}. Sits in the slot where the disabled
 * "Hide $" pill used to live (savings header right side). Mirrors
 * approved design `06-accounts-header-entry.svg` F1:
 *
 * <ul>
 *   <li>Pill chip ~106×32, white background, soft border.</li>
 *   <li>Bank icon (CSS-drawn columns + roof) + count + label "accounts".</li>
 *   <li>Floating amber notification badge in the top-right corner when
 *       any account is in STALE/ERROR — shows the stale count.</li>
 *   <li>Tap → opens the bottom sheet.</li>
 * </ul>
 *
 * <p>Hidden when the user has zero accounts AND no stale alerts —
 * keeps the header clean for a fresh signup whose seed-Manual hasn't
 * landed yet. (Edge case for the first 500ms after login.)
 */
@Component({
  selector: 'pgz-accounts-chip',
  standalone: true,
  imports: [CommonModule, MatBottomSheetModule],
  templateUrl: './accounts-chip.component.html',
  styleUrl: './accounts-chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountsChipComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly accountsService = inject(AccountsService);

  public readonly accounts = toSignal(this.store.select(selectAccountsList), {
    initialValue: [],
  });

  public readonly staleCount = toSignal(
    this.store.select(selectStaleAccountsCount),
    { initialValue: 0 },
  );

  ngOnInit(): void {
    // Idempotent — savings.component already calls this, but the chip
    // might be mounted in isolation (story / future global header).
    this.accountsService.init();
  }

  public onOpen(): void {
    this.bottomSheet.open(AccountsSheetComponent, {
      panelClass: 'pgz-accounts-sheet-panel',
    });
  }
}
