import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  MatBottomSheet,
  MatBottomSheetModule,
} from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  MatSnackBar,
  MatSnackBarModule,
} from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  IAccountV2,
  accountDisplayName,
} from '../../../../../domain/account-v2.domain';
import { PageHeaderComponent } from '../../../../../core/UI/components/page-header/page-header.component';
import { NotificationComponent } from '../../../../../core/UI/components/notification/notification.component';
import { AccountsService } from '../../../service/accounts.service';
import { HoldingService } from '../../../service/holding.service';
import { selectAccountsList } from '../../../store/accounts.selectors';
import { selectHoldingsList } from '../../../store/holdings.selectors';
import {
  DeleteAccountConfirmComponent,
  DeleteAccountConfirmData,
  DeleteAccountConfirmResult,
} from '../delete-account-confirm/delete-account-confirm.component';

const MATERIAL_MODULES = [
  MatIconModule,
  MatButtonModule,
  MatBottomSheetModule,
  MatSnackBarModule,
];

@Component({
  selector: 'pgz-accounts-list',
  standalone: true,
  imports: [CommonModule, ...MATERIAL_MODULES, PageHeaderComponent],
  templateUrl: './accounts-list.component.html',
  styleUrl: './accounts-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountsListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly store = inject(Store);
  private readonly accountsService = inject(AccountsService);
  private readonly holdingsService = inject(HoldingService);
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly snackBar = inject(MatSnackBar);

  public readonly accounts = toSignal(this.store.select(selectAccountsList), {
    initialValue: [] as IAccountV2[],
  });

  /**
   * Map<accountId, holdingsCount> — drives the delete confirm copy
   * ("this will also wipe N holdings"). Derived from the holdings store
   * so it auto-updates if the user deletes a holding in another tab.
   */
  private readonly holdingsByAccount = toSignal(
    this.store.select(selectHoldingsList),
    { initialValue: [] },
  );

  public readonly holdingCountByAccount = computed<Map<string, number>>(() => {
    const counts = new Map<string, number>();
    for (const h of this.holdingsByAccount()) {
      if (h.accountId) {
        counts.set(h.accountId, (counts.get(h.accountId) ?? 0) + 1);
      }
    }
    return counts;
  });

  ngOnInit(): void {
    this.accountsService.init();
    // Need holdings to compute the delete-confirm warning copy; init is
    // idempotent so calling here costs nothing if /savings already ran it.
    this.holdingsService.init();
  }

  public goBack(): void {
    this.router.navigate(['/savings']);
  }

  public onAdd(): void {
    this.router.navigate(['/savings/accounts/add']);
  }

  public onEdit(account: IAccountV2): void {
    this.router.navigate(['/savings/accounts/edit', account.id]);
  }

  public onDelete(account: IAccountV2, event: Event): void {
    event.stopPropagation();
    const label = accountDisplayName(account);
    const data: DeleteAccountConfirmData = {
      label,
      holdingsCount: this.holdingCountByAccount().get(account.id) ?? 0,
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
          this.showSnackbar(`Account «${label}» deleted`);
          // CASCADE FK wiped holdings on the server — pull fresh list so
          // the UI doesn't keep ghost rows for them.
          this.holdingsService.init();
        },
        error: (err) => this.showSnackbar(
          `Could not delete «${label}»: ${describeDeleteAccountError(err)}`,
        ),
      });
    });
  }

  public displayName(a: IAccountV2): string {
    return accountDisplayName(a);
  }

  private showSnackbar(message: string): void {
    this.snackBar.openFromComponent(NotificationComponent, {
      duration: 2500,
      data: { message },
      panelClass: 'custom-snackbar',
    });
  }
}

function describeDeleteAccountError(err: unknown): string {
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
