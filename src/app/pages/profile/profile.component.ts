import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, Signal, computed, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../service/auth.service';
import { UserService } from '../../service/user.service';
import { IconComponent } from '../../core/UI/components/icon/icon.component';
import { AnonymousModeService } from '../../core/anonymous-mode/anonymous-mode.service';
import { DemoDataService } from '../../core/services/demo-data.service';
import {
  DemoActionsSheetComponent,
  DemoActionsSheetData,
  DemoActionsSheetResult,
} from '../savings/components/demo-banner/demo-actions-sheet.component';
import { SystemComponent } from './components/system/system.component';
import { IUser, UserMode } from '../../model/User';
import { PageHeaderComponent } from '../../core/UI/components/page-header/page-header.component';
import { SettingsCardComponent } from '../../core/UI/components/settings-card/settings-card.component';
import { SettingsRowComponent } from '../../core/UI/components/settings-row/settings-row.component';
import { AnonymousNudgeComponent } from '../../core/UI/components/anonymous-nudge/anonymous-nudge.component';
import { MonthlyBudget, TotalBalanceService } from '../../core/UI/components/total-balance/total-balance.service';
import { environment } from '../../../environments/environment';


const UI_MODULES = [
  SystemComponent,
  IconComponent,
  PageHeaderComponent,
  SettingsCardComponent,
  SettingsRowComponent,
  AnonymousNudgeComponent,
];

const MATERIAL_MODULES = [
  MatSlideToggleModule,
  FormsModule,
  ReactiveFormsModule,
  MatFormFieldModule,
  MatInputModule,
  MatButtonModule,
];

@Component({
  selector: 'pgz-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [...UI_MODULES, ...MATERIAL_MODULES],
})
export class ProfileComponent implements OnInit {
  public isStageMode: boolean = true;
  public currentMode: UserMode = UserMode.Stage;

  public user: IUser | null = null;
  public userName: string = 'User';
  public userEmail: string;
  public isConfirmaEmail: boolean = true;
  public isAuthorizedUser: boolean = false;

  /** Money-formatted "$2,200" string for the Monthly budget row; empty when budget disabled. */
  public monthlyBudgetValue: string | null = null;

  /** Single uppercase letter shown in the avatar circle for authorized users. */
  public avatarInitial: string = 'U';

  /** Gate Stage Mode toggle to dev builds only — invisible in production. */
  public readonly isDevBuild: boolean = !environment.production;

  /**
   * Anonymous-mode lifecycle signals. Used by the disclosure section to
   * show "Anonymous mode — data on this device only" vs "Signed in as
   * <email> — backed up to cloud", and by the soft nudge banner after 7
   * days of accumulation (ADR-0012 §"Anonymous mode UX").
   */
  private readonly anonymous = inject(AnonymousModeService);
  public readonly isAnonymous = this.anonymous.isAnonymous;
  public readonly shouldShowNudge = this.anonymous.shouldShowNudge;

  /**
   * Demo-data lifecycle exposure for the new «Demo data» settings row
   * (PR5). Status badge text is computed reactively so the row label
   * updates after Clear / Restore without a manual `markForCheck`.
   */
  private readonly demoData = inject(DemoDataService);
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly snackBar = inject(MatSnackBar);

  public readonly isDemoActive = this.demoData.isDemoActive;
  public readonly demoStatusValue: Signal<string> = computed(() =>
    this.demoData.isDemoActive()
      ? `Active · ${this.demoData.demoItemsCount()} items`
      : 'Cleared',
  );

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private totalBalanceService: TotalBalanceService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) { }

  public ngOnInit(): void {
    this.userService.getUser().subscribe(user => {
      this.user = user;
      if (!user.name) {
        this.userName = this.userName + `${user.id}`;
      } else {
        this.userName = user.name;
      }
      this.currentMode = user?.mode;
      this.isStageMode = this.currentMode === UserMode.Stage;

      if (user && user.email) {
        this.userEmail = user.email;
        this.isAuthorizedUser = true;
      } else {
        this.userEmail = 'User not registered';
        this.isAuthorizedUser = false;
      }

      this.avatarInitial = this.computeAvatarInitial(user);
      this.cdr.markForCheck();
    });

    this.totalBalanceService.getMonthlyBudget().subscribe((budget: MonthlyBudget) => {
      this.monthlyBudgetValue = budget?.isEnabled && budget?.amount
        ? this.formatBudget(budget.amount)
        : null;
      this.cdr.markForCheck();
    });
  }

  private formatBudget(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  public onToggleChange(): void {
    const newMode = this.isStageMode ? UserMode.Stage : UserMode.Dev;
    this.changeMode(newMode);
  }

  public changeMode(newMode: UserMode): void {
    const updatedUser: IUser = { ...this.user, mode: newMode };
    this.userService.saveIUser(updatedUser);
    this.cdr.detectChanges();
  }

  public logout(): void {
    this.authService.logOut();
    // Phase 3a fix: logout no longer wipes spending/savings state.
    // The user reverts to anonymous mode keeping local data —
    // re-evaluate the disclosure section.
    this.anonymous.refresh();
  }

  public login(): void {
    this.router.navigate(['/auth']);
  }

  public registration(): void {
    this.router.navigate(['/auth/registration']);
  }

  public dismissAnonymousNudge(): void {
    this.anonymous.dismissNudge();
  }

  public changeProfileSettings(): void {
    this.router.navigate(['/profile/profile-settings']);
  }

  public changeMonthlyBudget(): void {
    this.router.navigate(['/profile/monthly-budget']);
  }

  public exportImport(): void {
    this.router.navigate(['/profile/export-import']);
  }

  /**
   * Open the demo-data actions sheet. Active → «Clear demo data»;
   * Cleared → «Restore demo data». Per task §6 PR5 (no chaining with
   * the eventual Privacy & data section redesign — that row will
   * migrate later via §6 PR5 Q3).
   */
  public async onDemoDataAction(): Promise<void> {
    const active = this.isDemoActive();
    const data: DemoActionsSheetData = {
      mode: active ? 'active' : 'cleared',
      summary: active
        ? `${this.demoData.demoItemsCount()} demo items will be removed`
        : '10 holdings · 7 accounts · 12 system tags',
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
    } else if (result === 'restore') {
      await this.demoData.restore();
      this.snackBar.open(
        'Demo data restored',
        undefined,
        { duration: 2500 },
      );
    }
  }

  public resendConfirmation(): void {
    // Hook for resending email confirmation; backend flow ships
    // alongside the email-confirm sub-task. Visual contract only here.
  }

  public onDeleteProfile(): void {
    // Multi-step destructive flow — sheet confirms before any wipe.
    // Reuses the PR4 confirm-sheet pattern once wired in a follow-up.
  }

  private computeAvatarInitial(user: IUser | null): string {
    const source = (user?.name || user?.email || '').trim();
    if (!source) {
      return 'U';
    }
    return source.charAt(0).toUpperCase();
  }
}
