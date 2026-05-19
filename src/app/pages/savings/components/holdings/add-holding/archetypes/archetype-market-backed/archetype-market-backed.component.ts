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
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { environment } from '../../../../../../../../environments/environment';
import { IAccountV2 } from '../../../../../../../domain/account-v2.domain';
import { AssetClass } from '../../../../../../../domain/asset-class.domain';
import { IHoldingLockMeta } from '../../../../../../../domain/holding.domain';
import { IInstrument } from '../../../../../../../domain/instrument.domain';
import {
  ArchetypeInitialValueMarketBacked,
  ArchetypeState,
  ArchetypeSubmission,
} from '../../../../../model/AddHoldingArchetype';
import { AccountsService } from '../../../../../service/accounts.service';
import { HoldingValidator } from '../../../../../validator/HoldingValidator';
import { CreateInstrumentInlineComponent } from '../../../create-instrument-inline/create-instrument-inline.component';
import { InstrumentAutocompleteComponent } from '../../../instrument-autocomplete/instrument-autocomplete.component';
import { TagChipsComponent } from '../../../tag-chips/tag-chips.component';
import { AccountEarnBlockComponent } from '../../account-earn-block/account-earn-block.component';
import {
  ADD_HOLDING_ACCOUNTS,
  AccountChoice,
  EARN_ACCOUNT_KINDS,
  toAccountChoice,
} from '../../accounts.const';

/**
 * Archetype 1 — Market-backed assets (STOCK / ETF / CRYPTO / TOKENIZED_STOCK).
 * Flow: pick instrument from autocomplete (or create inline) → qty + buy
 * price → account → optional earn block → tags. Per PR5b §5 Archetype 1.
 */
@Component({
  selector: 'pgz-archetype-market-backed',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    InstrumentAutocompleteComponent,
    CreateInstrumentInlineComponent,
    TagChipsComponent,
    AccountEarnBlockComponent,
  ],
  templateUrl: './archetype-market-backed.component.html',
  styleUrl: './archetype-market-backed.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArchetypeMarketBackedComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly accountsService = inject(AccountsService);
  private readonly router = inject(Router);

  @Input({ required: true })
  public set assetClass(value: AssetClass) {
    this._assetClass.set(value);
    if (this.form) {
      const q = this.form.get('quantity')!;
      q.clearValidators();
      q.addValidators(HoldingValidator.quantity(value));
      q.updateValueAndValidity({ emitEvent: false });
    }
  }
  public get assetClass(): AssetClass {
    return this._assetClass();
  }
  private readonly _assetClass = signal<AssetClass>(AssetClass.STOCK);

  /**
   * Edit-mode seed. When set, the form is pre-filled and
   * `selectedInstrument` is locked to the supplied instrument. Bound by
   * the orchestrator on `/savings/edit-holding/:id`. Null in add-mode.
   */
  @Input() public initialValue: ArchetypeInitialValueMarketBacked | null = null;

  /**
   * When supplied, the instrument autocomplete is replaced by a readonly
   * display — user cannot pick a different one (edit-mode invariant).
   * Treated independently of `initialValue` so the orchestrator can lock
   * the instrument without forcing a prefill of every other field.
   */
  @Input() public readOnlyInstrument: IInstrument | null = null;

  @Output() public stateChange = new EventEmitter<ArchetypeState>();

  /**
   * Account picker source. Demo mode shows the curated 7-bucket seed;
   * production reads the user's real accounts from {@link AccountsService}
   * (populated by `GET /api/v1/accounts`). Empty list → archetype renders
   * a "Create your first account →" CTA instead of the select.
   */
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

  public readonly selectedInstrument = signal<IInstrument | null>(null);
  public readonly showCreateInline = signal<boolean>(false);
  public readonly inlinePrefillSymbol = signal<string>('');

  /** True when the instrument slot is fixed (edit-mode). */
  public readonly instrumentLocked = computed(
    () => this.readOnlyInstrument !== null
  );

  /** Drives Earn block visibility — derived from currently chosen account kind. */
  public readonly selectedAccountKind = computed(() => {
    const id = this.form?.get('accountId')?.value;
    return this.accounts().find((a) => a.id === id)?.kind ?? null;
  });

  public readonly showEarn = computed(() => {
    const k = this.selectedAccountKind();
    return k !== null && EARN_ACCOUNT_KINDS.has(k);
  });

  public readonly totalCost = computed(() => {
    const q = Number(this.form?.get('quantity')?.value);
    const p = Number(this.form?.get('buyPrice')?.value);
    if (!Number.isFinite(q) || !Number.isFinite(p)) return 0;
    if (q <= 0 || p <= 0) return 0;
    return q * p;
  });

  ngOnInit(): void {
    // Trigger backend hydration; idempotent if /savings already did it.
    this.accountsService.init();

    const seed = this.initialValue;
    // Initial account: seed wins (edit mode); else first user account;
    // else literal 'manual' (demo mode only — production goes through
    // hasNoAccounts CTA instead of letting the user submit).
    const initialAccountId =
      seed?.accountId
        ?? this.accounts()[0]?.id
        ?? 'manual';
    this.form = this.fb.group({
      quantity:  [seed?.quantity ?? null, HoldingValidator.quantity(this._assetClass())],
      buyPrice:  [seed?.averageBuyPrice ?? null, HoldingValidator.buyPrice],
      accountId: [initialAccountId, Validators.required],
      lockMeta:  [seed?.lockMeta ?? (null as IHoldingLockMeta | null)],
      tagIds:    [seed?.tagIds ?? ([] as string[])],
    });

    if (this.readOnlyInstrument) {
      this.selectedInstrument.set(this.readOnlyInstrument);
    } else if (seed) {
      this.selectedInstrument.set(seed.instrument);
    }

    // Emit state on every relevant change. Use form's combined stream
    // (valueChanges + statusChanges) so the parent's "can save" indicator
    // stays in sync.
    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.emit());
    this.form.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.emit());

    if (seed || this.readOnlyInstrument) {
      this.emit();
    }
  }

  public onInstrumentSelected(inst: IInstrument | null): void {
    this.selectedInstrument.set(inst);
    this.emit();
  }

  public onCreateCustomRequested(symbolGuess: string): void {
    this.inlinePrefillSymbol.set(symbolGuess);
    this.showCreateInline.set(true);
  }

  public onInstrumentCreated(payload: { instrument: IInstrument }): void {
    this.showCreateInline.set(false);
    this.onInstrumentSelected(payload.instrument);
  }

  public onInstrumentCreateCancelled(): void {
    this.showCreateInline.set(false);
  }

  private emit(): void {
    const submission = this.buildSubmission();
    this.stateChange.emit({
      valid: submission !== null,
      submission,
    });
  }

  private buildSubmission(): ArchetypeSubmission | null {
    const inst = this.selectedInstrument();
    if (!inst || !this.form?.valid) return null;
    const v = this.form.value as {
      quantity: number;
      buyPrice: number;
      accountId: string;
      lockMeta: IHoldingLockMeta | null;
      tagIds: string[];
    };
    const account = this.accounts().find((a) => a.id === v.accountId);
    if (!account) return null;
    return {
      instrument: inst,
      quantity: Number(v.quantity),
      averageBuyPrice: Number(v.buyPrice),
      currency: inst.currency,
      accountId: account.id,
      accountName: account.name,
      accountKind: account.kind,
      tagIds: v.tagIds ?? [],
      ...(v.lockMeta ? { lockMeta: v.lockMeta } : {}),
    };
  }
}
