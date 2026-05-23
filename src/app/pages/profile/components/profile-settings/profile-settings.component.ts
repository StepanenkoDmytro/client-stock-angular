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
  public currencyLabel: string = 'USD · US Dollar';

  private originalUser: IUser | null = null;
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly userService = inject(UserService);

  /** Submit enabled only when the form is dirty + valid (no diff = nothing to save). */
  public get canSave(): boolean {
    return this.form.valid && this.form.dirty;
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
  }

  public prevRoute(): void {
    this.router.navigate(['/profile']);
  }

  public changeCurrency(): void {
    const items = ['USD · US Dollar', 'EUR · Euro', 'UAH · Hryvnia'];
    const activeItem = this.currencyLabel;

    const dialogRef = this.dialog.open(PopupSettingsListComponent, {
      maxWidth: '320px',
      data: { items, activeItem },
    });

    dialogRef.afterClosed().subscribe((picked: string) => {
      if (picked) {
        this.currencyLabel = picked;
        this.form.markAsDirty();
        this.cdr.markForCheck();
      }
    });
  }

  public save(): void {
    if (!this.canSave) {
      return;
    }
    const { name, email } = this.form.getRawValue();
    const updated: IUser = { ...(this.originalUser ?? ({} as IUser)), name, email };
    this.userService.saveIUser(updated);
    this.form.markAsPristine();
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
