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
import { AssetClass } from '../../../../../../../domain/asset-class.domain';
import { IHoldingLockMeta } from '../../../../../../../domain/holding.domain';
import { IInstrument } from '../../../../../../../domain/instrument.domain';
import {
  ArchetypeInitialValueManualCreate,
  ArchetypeState,
  ArchetypeSubmission,
} from '../../../../../model/AddHoldingArchetype';
import { HoldingValidator } from '../../../../../validator/HoldingValidator';
import { CreateInstrumentInlineComponent } from '../../../create-instrument-inline/create-instrument-inline.component';
import { TagChipsComponent } from '../../../tag-chips/tag-chips.component';
import { AccountEarnBlockComponent } from '../../account-earn-block/account-earn-block.component';
import {
  ADD_HOLDING_ACCOUNTS,
  AccountChoice,
  EARN_ACCOUNT_KINDS,
} from '../../accounts.const';

/**
 * Archetype 2 — Manual-create assets (REAL_ESTATE / DEPOSIT / OTHER).
 * Flow: create-instrument-inline (always expanded) → quantity (defaults
 * to 1 for REAL_ESTATE) + purchase price → account → optional earn block →
 * tags. Per PR5b §5 Archetype 2.
 */
@Component({
  selector: 'pgz-archetype-manual-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    CreateInstrumentInlineComponent,
    TagChipsComponent,
    AccountEarnBlockComponent,
  ],
  templateUrl: './archetype-manual-create.component.html',
  styleUrl: './archetype-manual-create.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArchetypeManualCreateComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  @Input({ required: true })
  public set assetClass(value: AssetClass) {
    this._assetClass.set(value);
    if (this.form) {
      const q = this.form.get('quantity')!;
      q.clearValidators();
      q.addValidators(HoldingValidator.quantity(value));
      q.updateValueAndValidity({ emitEvent: false });
      // REAL_ESTATE / OTHER default to qty=1; user can override.
      if (
        value === AssetClass.REAL_ESTATE ||
        value === AssetClass.OTHER
      ) {
        q.setValue(1, { emitEvent: false });
      }
    }
  }
  public get assetClass(): AssetClass {
    return this._assetClass();
  }
  private readonly _assetClass = signal<AssetClass>(AssetClass.REAL_ESTATE);

  /**
   * Edit-mode seed. When set, the form is pre-filled and the
   * `createdInstrument` slot is locked to the supplied instrument
   * (inline create panel is suppressed). Null in add-mode.
   */
  @Input() public initialValue: ArchetypeInitialValueManualCreate | null = null;

  /**
   * When supplied, the inline-create panel is suppressed and this
   * instrument is treated as fixed (edit-mode invariant). Independent
   * of `initialValue` so the orchestrator can lock the instrument
   * without prefilling every other field.
   */
  @Input() public readOnlyInstrument: IInstrument | null = null;

  @Output() public stateChange = new EventEmitter<ArchetypeState>();

  public readonly accounts: ReadonlyArray<AccountChoice> = ADD_HOLDING_ACCOUNTS;
  public form!: FormGroup;

  public readonly createdInstrument = signal<IInstrument | null>(null);

  /** True when the instrument slot is fixed (edit-mode). */
  public readonly instrumentLocked = computed(
    () => this.readOnlyInstrument !== null || this.initialValue !== null
  );

  public readonly selectedAccountKind = computed(() => {
    const id = this.form?.get('accountId')?.value;
    return this.accounts.find((a) => a.id === id)?.kind ?? null;
  });

  public readonly showEarn = computed(() => {
    const k = this.selectedAccountKind();
    return k !== null && EARN_ACCOUNT_KINDS.has(k);
  });

  /**
   * Whether to show the quantity input. REAL_ESTATE and OTHER default to
   * 1 (you don't have "2 of this exact apartment"), so hide the field
   * unless the user explicitly opens it. DEPOSIT shows it (different
   * amounts per term).
   */
  public readonly quantityVisible = computed(() => {
    const ac = this._assetClass();
    return ac !== AssetClass.REAL_ESTATE && ac !== AssetClass.OTHER;
  });

  public readonly totalCost = computed(() => {
    const q = Number(this.form?.get('quantity')?.value);
    const p = Number(this.form?.get('buyPrice')?.value);
    if (!Number.isFinite(q) || !Number.isFinite(p)) return 0;
    if (q <= 0 || p <= 0) return 0;
    return q * p;
  });

  ngOnInit(): void {
    const seed = this.initialValue;
    const defaultQty =
      this._assetClass() === AssetClass.REAL_ESTATE ||
      this._assetClass() === AssetClass.OTHER
        ? 1
        : null;

    this.form = this.fb.group({
      quantity:  [seed?.quantity ?? defaultQty, HoldingValidator.quantity(this._assetClass())],
      buyPrice:  [seed?.averageBuyPrice ?? null, HoldingValidator.buyPrice],
      accountId: [seed?.accountId ?? 'manual', Validators.required],
      lockMeta:  [seed?.lockMeta ?? (null as IHoldingLockMeta | null)],
      tagIds:    [seed?.tagIds ?? ([] as string[])],
    });

    const lockedInstrument = this.readOnlyInstrument ?? seed?.instrument ?? null;
    if (lockedInstrument) {
      this.createdInstrument.set(lockedInstrument);
    }

    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.emit());
    this.form.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.emit());

    if (lockedInstrument) {
      this.emit();
    }
  }

  public onInstrumentCreated(payload: { instrument: IInstrument }): void {
    this.createdInstrument.set(payload.instrument);
    this.emit();
  }

  public onInstrumentCreateCancelled(): void {
    // Manual-only flow — no way to proceed without an instrument; reopen
    // is implicit on next interaction. Simply clear.
    this.createdInstrument.set(null);
    this.emit();
  }

  private emit(): void {
    const submission = this.buildSubmission();
    this.stateChange.emit({
      valid: submission !== null,
      submission,
    });
  }

  private buildSubmission(): ArchetypeSubmission | null {
    const inst = this.createdInstrument();
    if (!inst || !this.form?.valid) return null;
    const v = this.form.value as {
      quantity: number;
      buyPrice: number;
      accountId: string;
      lockMeta: IHoldingLockMeta | null;
      tagIds: string[];
    };
    const account = this.accounts.find((a) => a.id === v.accountId);
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
