import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { environment } from '../../../../../../../../environments/environment';
import { IAccountV2 } from '../../../../../../../domain/account-v2.domain';
import { AssetClass } from '../../../../../../../domain/asset-class.domain';
import { IHoldingLockMeta } from '../../../../../../../domain/holding.domain';
import { IInstrument } from '../../../../../../../domain/instrument.domain';
import {
  ArchetypeInitialValueSingleAmount,
  ArchetypeState,
  ArchetypeSubmission,
} from '../../../../../model/AddHoldingArchetype';
import { AccountsService } from '../../../../../service/accounts.service';
import { HoldingValidator } from '../../../../../validator/HoldingValidator';
import { InstrumentService } from '../../../../../service/instrument.service';
import { TagChipsComponent } from '../../../tag-chips/tag-chips.component';
import { AccountEarnBlockComponent } from '../../account-earn-block/account-earn-block.component';
import {
  ADD_HOLDING_ACCOUNTS,
  AccountChoice,
  EARN_ACCOUNT_KINDS,
  toAccountChoice,
} from '../../accounts.const';

interface CurrencyOption {
  code: string;
  name: string;
}

/**
 * Currency picker for Archetype 3 (Cash). Top-15 most likely choices for
 * a Ukrainian user; full ISO list is overkill for the MVP. PR5b §10 #4.
 */
const CURRENCIES: ReadonlyArray<CurrencyOption> = [
  { code: 'USD', name: 'US dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'UAH', name: 'Ukrainian hryvnia' },
  { code: 'PLN', name: 'Polish złoty' },
  { code: 'GBP', name: 'British pound' },
  { code: 'CHF', name: 'Swiss franc' },
  { code: 'JPY', name: 'Japanese yen' },
  { code: 'CAD', name: 'Canadian dollar' },
  { code: 'AUD', name: 'Australian dollar' },
  { code: 'NOK', name: 'Norwegian krone' },
  { code: 'SEK', name: 'Swedish krona' },
  { code: 'CZK', name: 'Czech koruna' },
  { code: 'TRY', name: 'Turkish lira' },
];

/**
 * Archetype 3 — Single-amount assets (CASH). Flow: currency picker →
 * single amount → account → optional earn block (FLEXIBLE for Mono) →
 * tags. Per PR5b §5 Archetype 3.
 *
 * <p>Cash holdings convention (ADR-0001):
 * {@code quantity = amount, averageBuyPrice = 1.0}. We auto-create the
 * Instrument on submit via {@code InstrumentService.getOrCreate} keyed by
 * the picked currency code.
 */
@Component({
  selector: 'pgz-archetype-single-amount',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    TagChipsComponent,
    AccountEarnBlockComponent,
  ],
  templateUrl: './archetype-single-amount.component.html',
  styleUrl: './archetype-single-amount.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArchetypeSingleAmountComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly instruments = inject(InstrumentService);
  private readonly accountsService = inject(AccountsService);

  @Input({ required: true })
  public set assetClass(value: AssetClass) {
    this._assetClass.set(value);
  }
  public get assetClass(): AssetClass {
    return this._assetClass();
  }
  private readonly _assetClass = signal<AssetClass>(AssetClass.CASH);

  /**
   * Edit-mode seed. When set, prefills the currency / amount / account /
   * tags. Null in add-mode.
   */
  @Input() public initialValue: ArchetypeInitialValueSingleAmount | null = null;

  @Output() public stateChange = new EventEmitter<ArchetypeState>();

  public readonly currencies = CURRENCIES;

  private readonly _userAccounts = toSignal(this.accountsService.getAll(), {
    initialValue: [] as IAccountV2[],
  });

  public readonly accounts = computed<ReadonlyArray<AccountChoice>>(() => {
    if (environment.demoData) return ADD_HOLDING_ACCOUNTS;
    return this._userAccounts().map(toAccountChoice);
  });

  public readonly hasNoAccounts = computed(
    () => !environment.demoData && this.accounts().length === 0,
  );

  public form!: FormGroup;

  public readonly selectedAccountKind = computed(() => {
    const id = this.form?.get('accountId')?.value;
    return this.accounts().find((a) => a.id === id)?.kind ?? null;
  });

  public readonly showEarn = computed(() => {
    const k = this.selectedAccountKind();
    return k !== null && EARN_ACCOUNT_KINDS.has(k);
  });

  ngOnInit(): void {
    this.accountsService.init();

    const seed = this.initialValue;
    const initialAccountId =
      seed?.accountId
        ?? this.accounts()[0]?.id
        ?? 'manual';
    this.form = this.fb.group({
      currency:  [seed?.currency ?? 'USD', Validators.required],
      amount:    [seed?.amount ?? null, HoldingValidator.quantity(AssetClass.CASH)],
      accountId: [initialAccountId, Validators.required],
      lockMeta:  [seed?.lockMeta ?? (null as IHoldingLockMeta | null)],
      tagIds:    [seed?.tagIds ?? ([] as string[])],
    });

    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.emit());
    this.form.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.emit());

    if (seed) {
      this.emit();
    }
  }

  private emit(): void {
    const submission = this.buildSubmission();
    this.stateChange.emit({
      valid: submission !== null,
      submission,
    });
  }

  private buildSubmission(): ArchetypeSubmission | null {
    if (!this.form?.valid) return null;
    const v = this.form.value as {
      currency: string;
      amount: number;
      accountId: string;
      lockMeta: IHoldingLockMeta | null;
      tagIds: string[];
    };
    const account = this.accounts().find((a) => a.id === v.accountId);
    if (!account) return null;

    // Look up or create the cash Instrument keyed by currency. Per ADR-0001
    // there's one Cash Instrument per fiat currency in the system.
    const instrument = this.instruments.getOrCreate({
      symbol: v.currency,
      assetClass: AssetClass.CASH,
      name: `${v.currency} Cash`,
      currency: v.currency,
      metadata: { kind: AssetClass.CASH, currency: v.currency },
    });

    return {
      instrument,
      quantity: Number(v.amount),
      averageBuyPrice: 1,
      currency: v.currency,
      accountId: account.id,
      accountName: account.name,
      accountKind: account.kind,
      tagIds: v.tagIds ?? [],
      ...(v.lockMeta ? { lockMeta: v.lockMeta } : {}),
    };
  }
}
