import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheet,
  MatBottomSheetModule,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  MatSnackBar,
  MatSnackBarModule,
} from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { IAccountV2 } from '../../../../../domain/account-v2.domain';
import { NotificationComponent } from '../../../../../core/UI/components/notification/notification.component';
import { AccountsService } from '../../../service/accounts.service';
import { HoldingService } from '../../../service/holding.service';
import {
  IAccountWithCount,
  selectAccountsWithCount,
  selectStaleAccountsCount,
} from '../../../store/accounts.selectors';
import { AccountRowComponent } from '../account-row/account-row.component';
import {
  DeleteAccountConfirmComponent,
  DeleteAccountConfirmData,
  DeleteAccountConfirmResult,
} from '../delete-account-confirm/delete-account-confirm.component';

/**
 * Bottom-sheet UI for managing accounts — header chip
 * (`<pgz-accounts-chip>`) opens this. Mirrors approved design
 * `06-accounts-header-entry.svg` F2:
 *
 * <ul>
 *   <li>Drag handle + "Accounts" header + ✕ close + "{N} connected · {M} needs attention" subtitle.</li>
 *   <li>Dashed "+ Add account" CTA full-width at the top.</li>
 *   <li>List of `<pgz-account-row>` — sorted stale/error first, then by value desc
 *       (value sort = holdingCount desc for now until we wire FX aggregation).</li>
 *   <li>"Manage all →" footer link to /savings/accounts (stub page).</li>
 * </ul>
 *
 * Row events (edit / delete / retry) are handled inline here without
 * a route navigation — keeps the sheet feeling like a single
 * interaction surface. Delete chains into the existing
 * `DeleteAccountConfirmComponent` bottom-sheet.
 */
@Component({
  selector: 'pgz-accounts-sheet',
  standalone: true,
  imports: [
    CommonModule,
    MatBottomSheetModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    AccountRowComponent,
  ],
  templateUrl: './accounts-sheet.component.html',
  styleUrl: './accounts-sheet.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountsSheetComponent {
  private readonly sheetRef = inject(
    MatBottomSheetRef<AccountsSheetComponent>,
  );
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly store = inject(Store);
  private readonly accountsService = inject(AccountsService);
  private readonly holdingsService = inject(HoldingService);

  public readonly accounts = toSignal(
    this.store.select(selectAccountsWithCount),
    { initialValue: [] as IAccountWithCount[] },
  );

  public readonly staleCount = toSignal(
    this.store.select(selectStaleAccountsCount),
    { initialValue: 0 },
  );

  public readonly totalCount = computed(() => this.accounts().length);

  /**
   * Sort: stale/error first, then by holdingCount desc, then by name asc.
   * Once portfolio aggregation reaches accounts level we'll switch
   * second-tier to `totalValueBaseCurrency desc` per the design.
   */
  public readonly sortedAccounts = computed<IAccountWithCount[]>(() => {
    const list = [...this.accounts()];
    list.sort((a, b) => {
      const aAttention = isAttention(a) ? 0 : 1;
      const bAttention = isAttention(b) ? 0 : 1;
      if (aAttention !== bAttention) return aAttention - bAttention;
      if (a.holdingCount !== b.holdingCount) return b.holdingCount - a.holdingCount;
      return (a.accountNumber ?? '').localeCompare(b.accountNumber ?? '');
    });
    return list;
  });

  public readonly subtitle = computed(() => {
    const stale = this.staleCount();
    const total = this.totalCount();
    const noun = total === 1 ? 'account' : 'accounts';
    if (stale === 0) return `${total} ${noun}`;
    return `${total} ${noun} · ${stale} needs attention`;
  });

  public onClose(): void {
    this.sheetRef.dismiss();
  }

  public onAdd(): void {
    // Navigate to the existing AccountFormComponent route — it already
    // handles create-mode end-to-end. A full sheet-mode wrapper for the
    // form lands in a separate commit; for now we close the sheet and
    // push the user onto the form route.
    this.sheetRef.dismiss();
    this.router.navigate(['/savings/accounts/add']);
  }

  public onManageAll(): void {
    this.sheetRef.dismiss();
    this.router.navigate(['/savings/accounts']);
  }

  public onEdit(account: IAccountV2): void {
    this.sheetRef.dismiss();
    this.router.navigate(['/savings/accounts/edit', account.id]);
  }

  public onRetry(account: IAccountV2): void {
    this.accountsService.retrySync(account.id);
    this.toast(`Retrying sync for ${displayName(account)}…`);
  }

  public onDelete(account: IAccountV2): void {
    const row = this.accounts().find((a) => a.id === account.id);
    const holdingsCount = row?.holdingCount ?? 0;
    const data: DeleteAccountConfirmData = {
      label: displayName(account),
      holdingsCount,
    };
    const ref = this.bottomSheet.open<
      DeleteAccountConfirmComponent,
      DeleteAccountConfirmData,
      DeleteAccountConfirmResult
    >(DeleteAccountConfirmComponent, { data });

    ref.afterDismissed().subscribe((result) => {
      if (result !== 'delete') return;
      this.accountsService.deleteAccount(account.id).subscribe({
        next: () => {
          this.toast(`Account ${data.label} deleted`);
          // CASCADE FK wiped holdings server-side — re-pull to drop ghosts.
          this.holdingsService.init();
        },
        error: (err) => this.toast(
          `Could not delete ${data.label}: ${describeError(err)}`,
        ),
      });
    });
  }

  private toast(message: string): void {
    this.snackBar.openFromComponent(NotificationComponent, {
      duration: 2500,
      data: { message },
      panelClass: 'custom-snackbar',
    });
  }
}

function isAttention(a: IAccountWithCount): boolean {
  return a.syncStatus === 'STALE' || a.syncStatus === 'ERROR';
}

function displayName(a: IAccountV2): string {
  if (a.accountNumber && a.accountNumber.trim().length > 0) return a.accountNumber;
  if (a.provider) return `${a.provider} ${a.accountType.toLowerCase()}`;
  return a.accountType === 'MANUAL' ? 'Manual' : a.accountType.toLowerCase();
}

function describeError(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as { status?: number; error?: { message?: string } };
    if (e.status === 0) return 'no network';
    if (e.status === 404) return 'already deleted';
    if (e.status === 403) return 'not your account';
    if (e.status && e.status >= 500) return 'server error';
    if (e.error && e.error.message) return e.error.message;
  }
  return 'unexpected error';
}
