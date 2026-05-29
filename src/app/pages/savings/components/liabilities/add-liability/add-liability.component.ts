import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { PageHeaderComponent } from '../../../../../core/UI/components/page-header/page-header.component';
import {
  ILiability,
  LiabilityType,
  isRevolvingLiability,
} from '../../../../../domain/liability.domain';
import { SUPPORTED_BASE_CURRENCIES } from '../../../../../domain/user-preferences.domain';
import { LiabilitiesService } from '../../../../../service/liabilities.service';
import { UserPreferencesService } from '../../../service/user-preferences.service';

interface TypeOption {
  value: LiabilityType;
  label: string;
}

/**
 * Add-Liability form (ADR-0009 · plan L4). Reactive form per the repo
 * convention; persists to the localStorage `LiabilitiesService` (anonymous-
 * safe). Term debts collect a payoff date (→ debt-payoff goal); revolving
 * ones hide it (no payoff date by definition).
 */
@Component({
  selector: 'pgz-add-liability',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    PageHeaderComponent,
  ],
  templateUrl: './add-liability.component.html',
  styleUrl: './add-liability.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddLiabilityComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly liabilitiesService = inject(LiabilitiesService);
  private readonly userPrefs = inject(UserPreferencesService);

  public form!: FormGroup;

  public readonly currencies: ReadonlyArray<string> = SUPPORTED_BASE_CURRENCIES;

  public readonly types: ReadonlyArray<TypeOption> = [
    { value: 'MORTGAGE', label: 'Mortgage' },
    { value: 'AUTO_LOAN', label: 'Auto loan' },
    { value: 'STUDENT_LOAN', label: 'Student loan' },
    { value: 'PERSONAL_LOAN', label: 'Personal loan' },
    { value: 'CREDIT_CARD', label: 'Credit card' },
    { value: 'BNPL', label: 'Buy now, pay later' },
    { value: 'MARGIN_LOAN', label: 'Margin loan' },
    { value: 'OTHER', label: 'Other' },
  ];

  public ngOnInit(): void {
    const base = (this.userPrefs.baseCurrency() ?? 'USD').toUpperCase();
    this.form = this.fb.group({
      type: ['MORTGAGE' as LiabilityType, Validators.required],
      lender: [''],
      principalBalance: [null, [Validators.required, Validators.min(0)]],
      originalAmount: [null, [Validators.required, Validators.min(0)]],
      currency: [base, Validators.required],
      interestRate: [0, [Validators.min(0)]],
      rateType: ['FIXED'],
      endDate: [''],
      notes: [''],
    });
  }

  /** Revolving debts have no payoff date — hide the end-date field. */
  public get isRevolving(): boolean {
    return isRevolvingLiability(this.form?.get('type')?.value as LiabilityType);
  }

  public save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const liability: ILiability = {
      type: v.type,
      lender: (v.lender ?? '').trim() || undefined,
      principalBalance: Number(v.principalBalance) || 0,
      originalAmount: Number(v.originalAmount) || Number(v.principalBalance) || 0,
      currency: v.currency,
      interestRate: Number(v.interestRate) || 0,
      rateType: v.rateType,
      endDate: !this.isRevolving && v.endDate ? v.endDate : undefined,
      notes: (v.notes ?? '').trim() || undefined,
      isSaved: false,
    };
    this.liabilitiesService.addLiability(liability);
    this.snackBar.open('Liability added', 'Dismiss', { duration: 3000 });
    this.router.navigate(['/savings']);
  }

  public prevRoute(): void {
    this.router.navigate(['/savings']);
  }
}
