import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  computed,
  forwardRef,
  signal,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AccountKind } from '../../../../../../domain/account-kind.domain';
import { IHoldingLockMeta } from '../../../../../../domain/holding.domain';
import { EARN_ACCOUNT_KINDS } from '../accounts.const';

interface LockPeriodOption {
  days: number | null;
  label: string;
}

const LOCK_PERIODS: ReadonlyArray<LockPeriodOption> = [
  { days: null, label: 'No lock (flexible)' },
  { days: 7,    label: '7-day lock' },
  { days: 14,   label: '14-day lock' },
  { days: 30,   label: '30-day lock' },
  { days: 60,   label: '60-day lock' },
  { days: 90,   label: '90-day lock' },
  { days: 180,  label: '180-day lock' },
  { days: 365,  label: '365-day lock' },
];

/**
 * EARN block — APR + optional lock period. Mounts under the Account
 * picker whenever the chosen account's kind is in {@link EARN_ACCOUNT_KINDS}
 * (EXCHANGE_EARN / BANK_DEPOSIT / BANK_SAVINGS).
 *
 * <p>{@link ControlValueAccessor} of {@link IHoldingLockMeta} — parent
 * form sees a single control whose value is either {@code null} (no earn)
 * or one of `STAKING` / `FLEXIBLE` per ADR-0001. The variant is derived:
 * APR with no lock → FLEXIBLE, APR with a lock → STAKING.
 *
 * <p>BANK_DEPOSIT specifically would produce TERM_DEPOSIT, but at this
 * MVP cut we treat it the same as STAKING (apr + period) and let a
 * future iteration add maturityDate input.
 */
@Component({
  selector: 'pgz-account-earn-block',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './account-earn-block.component.html',
  styleUrl: './account-earn-block.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AccountEarnBlockComponent),
      multi: true,
    },
  ],
})
export class AccountEarnBlockComponent implements ControlValueAccessor {
  @Input()
  public set accountKind(value: AccountKind | null | undefined) {
    this._accountKind.set(value ?? null);
  }
  public get accountKind(): AccountKind | null {
    return this._accountKind();
  }
  private readonly _accountKind = signal<AccountKind | null>(null);

  public readonly visible = computed<boolean>(() => {
    const kind = this._accountKind();
    return kind !== null && EARN_ACCOUNT_KINDS.has(kind);
  });

  public readonly lockPeriods = LOCK_PERIODS;

  /** Current APR in percent (5 means 5%). */
  public apr = signal<number | null>(null);
  /** Lock period in days; {@code null} = flexible (no lock). */
  public lockDays = signal<number | null>(null);

  // ---- CVA wiring ----
  private onChange: (value: IHoldingLockMeta | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: IHoldingLockMeta | null): void {
    if (!value) {
      this.apr.set(null);
      this.lockDays.set(null);
      return;
    }
    switch (value.kind) {
      case 'STAKING':
        this.apr.set(value.apr);
        this.lockDays.set(this.lockPeriodToDays(value.lockPeriod));
        return;
      case 'FLEXIBLE':
        this.apr.set(value.apr);
        this.lockDays.set(null);
        return;
      case 'TERM_DEPOSIT':
        this.apr.set(value.apr ?? null);
        this.lockDays.set(null);
        return;
    }
  }

  registerOnChange(fn: (value: IHoldingLockMeta | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  public onAprInput(raw: string): void {
    const num = raw === '' ? null : Number(raw);
    this.apr.set(Number.isFinite(num) ? (num as number) : null);
    this.emit();
  }

  public onLockChange(days: number | null): void {
    this.lockDays.set(days);
    this.emit();
  }

  public onBlur(): void {
    this.onTouched();
  }

  private emit(): void {
    const apr = this.apr();
    if (apr === null || apr <= 0) {
      this.onChange(null);
      return;
    }
    const days = this.lockDays();
    if (days === null) {
      this.onChange({ kind: 'FLEXIBLE', apr });
      return;
    }
    this.onChange({
      kind: 'STAKING',
      apr,
      lockPeriod: `${days}-day lock`,
    });
  }

  private lockPeriodToDays(period: string | undefined): number | null {
    if (!period) return null;
    const match = period.match(/^(\d+)/);
    return match ? Number(match[1]) : null;
  }
}
