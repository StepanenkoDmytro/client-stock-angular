import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';

import { PageHeaderComponent } from '../../../../core/UI/components/page-header/page-header.component';
import { PopupSettingsListComponent } from '../ui-settings/popup-settings-list/popup-settings-list.component';
import { UserService } from '../../../../service/user.service';
import { IUser } from '../../../../model/User';
import { UserPreferencesService } from '../../../savings/service/user-preferences.service';
import { SUPPORTED_BASE_CURRENCIES } from '../../../../domain/user-preferences.domain';

/** ISO code → human label for the currency picker. */
const CURRENCY_NAMES: Readonly<Record<string, string>> = {
  USD: 'US Dollar',
  EUR: 'Euro',
  UAH: 'Hryvnia',
  PLN: 'Polish Złoty',
  GBP: 'Pound Sterling',
  CHF: 'Swiss Franc',
  JPY: 'Japanese Yen',
  CAD: 'Canadian Dollar',
  AUD: 'Australian Dollar',
};

const formatCurrencyLabel = (code: string): string =>
  `${code} · ${CURRENCY_NAMES[code] ?? code}`;

const extractCurrencyCode = (label: string): string => label.split(' ')[0]?.toUpperCase() ?? 'USD';

interface ProfileSettingsForm {
  name: FormControl<string>;
  email: FormControl<string>;
}

@Component({
  selector: 'pgz-profile-settings',
  standalone: true,
  imports: [PageHeaderComponent, ReactiveFormsModule, MatInputModule, MatButtonModule],
  templateUrl: './profile-settings.component.html',
  styleUrl: './profile-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileSettingsComponent implements OnInit {
  public form: FormGroup<ProfileSettingsForm> = new FormGroup<ProfileSettingsForm>({
    name: new FormControl<string>('', { nonNullable: true }),
    email: new FormControl<string>('', { nonNullable: true, validators: [Validators.email] }),
  });

  public avatarInitial: string = 'U';
  public isEmailConfirmed: boolean = false;
  public currencyLabel: string = formatCurrencyLabel('USD');

  private originalUser: IUser | null = null;
  /** Tracks the saved baseCurrency so we know whether the picker changed it. */
  private originalCurrency: string = 'USD';
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly userService = inject(UserService);
  private readonly userPrefs = inject(UserPreferencesService);

  /** Submit enabled when there's something to save: form changed OR currency picked. */
  public get canSave(): boolean {
    if (!this.form.valid) {
      return false;
    }
    return this.form.dirty || this.currencyChanged;
  }

  private get currencyChanged(): boolean {
    return extractCurrencyCode(this.currencyLabel) !== this.originalCurrency;
  }

  public ngOnInit(): void {
    this.userService.getUser().subscribe(user => {
      this.originalUser = user;
      this.form.patchValue({
        name: user?.name ?? '',
        email: user?.email ?? '',
      }, { emitEvent: false });
      this.form.markAsPristine();
      this.avatarInitial = this.computeAvatarInitial(user);
      this.cdr.markForCheck();
    });

    // Hydrate the currency picker from the live preference signal.
    // For authenticated users `load()` populates `_current`; for anonymous
    // users it short-circuits to null but the computed `baseCurrency`
    // falls back to localStorage, so we read from the signal in both
    // cases (a side-effect subscribe to load() refreshes server state
    // when available).
    const applyCurrency = () => {
      const code = (this.userPrefs.baseCurrency() ?? 'USD').toUpperCase();
      this.originalCurrency = code;
      this.currencyLabel = formatCurrencyLabel(code);
      this.cdr.markForCheck();
    };
    applyCurrency();
    this.userPrefs.load().subscribe(() => applyCurrency());
  }

  public prevRoute(): void {
    this.router.navigate(['/profile']);
  }

  public changeCurrency(): void {
    const items = SUPPORTED_BASE_CURRENCIES.map(formatCurrencyLabel);
    const activeItem = this.currencyLabel;

    const dialogRef = this.dialog.open(PopupSettingsListComponent, {
      maxWidth: '320px',
      data: { items, activeItem },
    });

    dialogRef.afterClosed().subscribe((picked: string) => {
      if (picked && picked !== this.currencyLabel) {
        this.currencyLabel = picked;
        this.cdr.markForCheck();
      }
    });
  }

  public save(): void {
    if (!this.canSave) {
      return;
    }
    if (this.form.dirty) {
      const { name, email } = this.form.getRawValue();
      const updated: IUser = { ...(this.originalUser ?? ({} as IUser)), name, email };
      this.userService.saveIUser(updated);
      this.form.markAsPristine();
    }
    if (this.currencyChanged) {
      const code = extractCurrencyCode(this.currencyLabel);
      this.userPrefs.setBaseCurrency(code).subscribe(prefs => {
        // Track the persisted value so canSave goes back to false until the
        // user picks something different again.
        this.originalCurrency = (prefs?.baseCurrency ?? code).toUpperCase();
        this.currencyLabel = formatCurrencyLabel(this.originalCurrency);
        this.cdr.markForCheck();
      });
    }
    this.cdr.markForCheck();
  }

  private computeAvatarInitial(user: IUser | null): string {
    const source = (user?.name || user?.email || '').trim();
    if (!source) {
      return 'U';
    }
    return source.charAt(0).toUpperCase();
  }
}
