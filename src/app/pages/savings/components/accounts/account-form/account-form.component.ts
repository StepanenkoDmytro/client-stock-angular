import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  MatSnackBar,
  MatSnackBarModule,
} from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map } from 'rxjs';
import {
  AccountTypeV2,
  IAccountV2,
  accountDisplayName,
} from '../../../../../domain/account-v2.domain';
import { PrevRouteComponent } from '../../../../../core/UI/components/prev-route/prev-route.component';
import { NotificationComponent } from '../../../../../core/UI/components/notification/notification.component';
import { AccountsService } from '../../../service/accounts.service';
import { selectAccountsList } from '../../../store/accounts.selectors';

const MATERIAL_MODULES = [
  MatFormFieldModule,
  MatInputModule,
  MatSelectModule,
  MatButtonModule,
  MatIconModule,
  MatSnackBarModule,
];

/**
 * Account types as enum-like tuple for template iteration. Order matches
 * roughly what testers will pick most often (Manual is rare).
 */
const ACCOUNT_TYPES: ReadonlyArray<AccountTypeV2> = [
  'BROKERAGE',
  'EXCHANGE',
  'BANK',
  'WALLET',
  'MANUAL',
];

/**
 * Short list of currencies we surface in the dropdown. The user can
 * still type any ISO 4217 code (3 letters) directly into the input.
 */
const COMMON_CURRENCIES: ReadonlyArray<string> = [
  'USD', 'EUR', 'UAH', 'PLN', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD',
];

@Component({
  selector: 'pgz-account-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ...MATERIAL_MODULES, PrevRouteComponent],
  templateUrl: './account-form.component.html',
  styleUrl: './account-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(Store);
  private readonly accountsService = inject(AccountsService);
  private readonly snackBar = inject(MatSnackBar);

  public readonly accountTypes = ACCOUNT_TYPES;
  public readonly currencies = COMMON_CURRENCIES;

  public form: FormGroup = this.fb.group({
    accountType: ['BROKERAGE' as AccountTypeV2, Validators.required],
    accountNumber: [''],
    provider: [''],
    currency: ['USD'],
  });

  /** Edit-mode holding (when route param :id was present). */
  private readonly routeId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('id'))),
    { initialValue: null as string | null },
  );

  private readonly accounts = toSignal(this.store.select(selectAccountsList), {
    initialValue: [] as IAccountV2[],
  });

  public readonly editing = computed<IAccountV2 | null>(() => {
    const id = this.routeId();
    if (!id) return null;
    return this.accounts().find((a) => a.id === id) ?? null;
  });

  public readonly isEdit = computed<boolean>(() => this.editing() !== null);

  public readonly title = computed<string>(() => {
    const e = this.editing();
    return e ? `Edit «${accountDisplayName(e)}»` : 'Add account';
  });

  /** Disable Save while a REST round-trip is in flight. */
  public readonly saving = signal<boolean>(false);

  ngOnInit(): void {
    this.accountsService.init();
    // Prefill on edit-mode — re-run on every editing() update to handle
    // the case where the store loads asynchronously after init.
    const prefillEffect = setInterval(() => {
      const e = this.editing();
      if (e) {
        this.form.patchValue(
          {
            accountType: e.accountType,
            accountNumber: e.accountNumber ?? '',
            provider: e.provider ?? '',
            currency: e.currency ?? '',
          },
          { emitEvent: false },
        );
        clearInterval(prefillEffect);
      } else if (!this.routeId()) {
        clearInterval(prefillEffect);
      }
    }, 50);
    // Safety: stop after 3 s even if the store never loads (404 edit URL).
    setTimeout(() => clearInterval(prefillEffect), 3000);
  }

  public onSave(): void {
    if (!this.form.valid || this.saving()) return;
    const v = this.form.getRawValue() as {
      accountType: AccountTypeV2;
      accountNumber: string;
      provider: string;
      currency: string;
    };
    const body = {
      accountType: v.accountType,
      accountNumber: trimToUndefined(v.accountNumber),
      provider: trimToUndefined(v.provider),
      currency: trimToUndefined(v.currency)?.toUpperCase(),
    };

    this.saving.set(true);
    const editing = this.editing();
    const op$ = editing
      ? this.accountsService.updateAccount(editing.id, body)
      : this.accountsService.addAccount(body);

    op$.subscribe({
      next: (saved) => {
        this.saving.set(false);
        const label = accountDisplayName(saved);
        this.showSnackbar(
          editing ? `Account «${label}» updated` : `Account «${label}» added`,
        );
        this.router.navigate(['/savings/accounts']);
      },
      error: (err) => {
        this.saving.set(false);
        this.showSnackbar(
          `Could not save account: ${describeAccountSaveError(err)}`,
        );
      },
    });
  }

  public onCancel(): void {
    this.router.navigate(['/savings/accounts']);
  }

  private showSnackbar(message: string): void {
    this.snackBar.openFromComponent(NotificationComponent, {
      duration: 2500,
      data: { message },
      panelClass: 'custom-snackbar',
    });
  }
}

function trimToUndefined(s: string | null | undefined): string | undefined {
  if (s == null) return undefined;
  const t = s.trim();
  return t.length === 0 ? undefined : t;
}

function describeAccountSaveError(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as { status?: number; error?: { message?: string } };
    if (e.status === 0) return 'no network';
    if (e.status === 403) return 'not your account';
    if (e.status && e.status >= 500) return 'server error';
    if (e.error && e.error.message) return e.error.message;
  }
  return 'unexpected error';
}
