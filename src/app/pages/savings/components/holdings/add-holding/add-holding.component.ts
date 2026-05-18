import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { v4 as uuid } from 'uuid';
import { AccountKind } from '../../../../../domain/account-kind.domain';
import {
  ASSET_CLASSES,
  AssetClass,
} from '../../../../../domain/asset-class.domain';
import { IHolding } from '../../../../../domain/holding.domain';
import { PrevRouteComponent } from '../../../../../core/UI/components/prev-route/prev-route.component';
import { defaultMetadataFor } from '../../../model/InstrumentMetadata';
import { HoldingService } from '../../../service/holding.service';
import { InstrumentService } from '../../../service/instrument.service';
import { TagsService } from '../../../service/tags.service';
import { selectHoldingsList } from '../../../store/holdings.selectors';
import { HoldingValidator } from '../../../validator/HoldingValidator';
import { CreateInstrumentInlineComponent } from '../create-instrument-inline/create-instrument-inline.component';
import { InstrumentAutocompleteComponent } from '../instrument-autocomplete/instrument-autocomplete.component';
import { TagChipsComponent } from '../tag-chips/tag-chips.component';
import { IInstrument } from '../../../../../domain/instrument.domain';

interface AccountChoice {
  id: string;
  name: string;
  kind: AccountKind;
}

/**
 * Add Holding form per `docs/notes/2026-05-pr4-crud-holdings-task.md` §5.
 *
 * This is the first cut (skeleton). Out of scope here — landing in
 * follow-up PRs in the PR7.x series:
 *  - PR7.5: tag-chips multi-select.
 *  - PR7.6: instrument autocomplete + "Create custom" inline (this form
 *    currently asks for symbol/name directly because there's nowhere to
 *    pick from yet — the user types them and we route through
 *    InstrumentService.getOrCreate).
 *
 * Market prices are NOT auto-fetched here — the user types `Buy price`
 * manually. Backend integration ("Market: $X" live indicator) is
 * deliberately deferred per product direction (frontend-only milestone).
 */
@Component({
  selector: 'pgz-add-holding',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatExpansionModule,
    PrevRouteComponent,
    TagChipsComponent,
    InstrumentAutocompleteComponent,
    CreateInstrumentInlineComponent,
  ],
  templateUrl: './add-holding.component.html',
  styleUrl: './add-holding.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddHoldingComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(Store);
  private readonly snackBar = inject(MatSnackBar);
  private readonly holdings = inject(HoldingService);
  private readonly instruments = inject(InstrumentService);
  private readonly tags = inject(TagsService);

  /** Edit-mode holding (when the route param `:id` was present and a
   *  matching holding was found). Drives prefill + top-up section visibility. */
  private readonly editing = signal<IHolding | null>(null);

  public readonly isEditMode = computed<boolean>(() => this.editing() !== null);

  /** The Instrument the user picked / created via the autocomplete. We
   *  hold a direct reference (not just symbol+name) so `saveAdd` doesn't
   *  need to re-resolve via `getOrCreate` for instruments that already
   *  came from the cache. Stays in sync with the form's `symbol`/`name`
   *  controls for validation. */
  public readonly selectedInstrument = signal<IInstrument | null>(null);

  /** Toggles the inline create-instrument panel inside the form. */
  public readonly showCreateInline = signal<boolean>(false);

  /** Prefill text for the inline form — taken from whatever the user
   *  typed before clicking «Create custom». */
  public readonly inlinePrefillSymbol = signal<string>('');

  public readonly title = computed<string>(() => {
    return this.isEditMode() ? 'Edit saving' : 'Add saving';
  });

  /**
   * Seed list of accounts. Account CRUD UI is out of scope for this PR
   * (§7 of the task doc) — the user picks from a fixed set that matches
   * the demo-seed accounts, plus a default Manual bucket. Real Account
   * entity / store lands later.
   */
  public readonly accounts: ReadonlyArray<AccountChoice> = [
    { id: 'manual',          name: 'Manual',                  kind: 'MANUAL' },
    { id: 'acc-ibkr',        name: 'Interactive Brokers',     kind: 'BROKERAGE_CASH' },
    { id: 'acc-robinhood',   name: 'Robinhood',               kind: 'BROKERAGE_CASH' },
    { id: 'acc-bybit-spot',  name: 'Bybit Spot',              kind: 'EXCHANGE_SPOT' },
    { id: 'acc-bybit-earn',  name: 'Bybit Earn',              kind: 'EXCHANGE_EARN' },
    { id: 'acc-trezor',      name: 'Cold wallet (Trezor)',    kind: 'WALLET_COLD' },
  ];

  /** Currencies offered in the form. Order = perceived popularity for the
   *  Ukrainian user base; user can type ISO 4217 manually later if needed. */
  public readonly currencies: ReadonlyArray<string> = ['USD', 'EUR', 'UAH', 'PLN', 'GBP'];

  /** Full enum, ordered as in `ASSET_CLASSES`. */
  public readonly assetClasses: ReadonlyArray<AssetClass> = ASSET_CLASSES;

  public form!: FormGroup;

  /** Mirror of the form's `assetClass` value as a signal so the template
   *  derives reactive labels / validators / suggested currency. */
  public readonly assetClass = signal<AssetClass>(AssetClass.STOCK);

  /** Combined `quantity × buyPrice` preview displayed under the form
   *  ("Total: $X"). Pure derived value — zero / NaN guarded. */
  public readonly totalCost = computed<number>(() => {
    const q = Number(this.form?.get('quantity')?.value);
    const p = Number(this.form?.get('buyPrice')?.value);
    if (!Number.isFinite(q) || !Number.isFinite(p)) {
      return 0;
    }
    if (q <= 0 || p <= 0) {
      return 0;
    }
    return q * p;
  });

  ngOnInit(): void {
    // Ensure dependencies bootstrapped (tags/instruments may not be hot if
    // the user reached this page via a deep-link before /savings rendered).
    this.tags.init();
    this.instruments.init();
    this.holdings.init();

    this.form = this.fb.group({
      assetClass:    [AssetClass.STOCK, Validators.required],
      symbol:        ['', HoldingValidator.nonEmpty],
      name:          ['', HoldingValidator.nonEmpty],
      quantity:      [null, HoldingValidator.quantity(AssetClass.STOCK)],
      buyPrice:      [null, HoldingValidator.buyPrice],
      currency:      ['USD', Validators.required],
      accountId:     ['manual', Validators.required],
      tagIds:        [[] as string[]],
      // Top-up section (edit mode only). Optional — empty means
      // "pure edit, no avg-price recalc".
      addQuantity:   [null],
      addBuyPrice:   [null],
    });

    // Re-bind the per-class quantity validator whenever assetClass changes —
    // CRYPTO allows 8 decimals, STOCK only 4, etc.
    this.form.get('assetClass')!.valueChanges.subscribe((cls: AssetClass) => {
      this.assetClass.set(cls);
      const q = this.form.get('quantity')!;
      q.clearValidators();
      q.addValidators(HoldingValidator.quantity(cls));
      q.updateValueAndValidity({ emitEvent: false });
    });

    // If route is `/savings/edit-holding/:id`, switch to edit mode.
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.bootstrapEditMode(idParam);
    }
  }

  /**
   * Edit-mode bootstrap: find the holding by id, then prefill the form +
   * lock the AssetClass/symbol/name controls (changing the class would
   * effectively be delete + recreate per task doc §5).
   */
  private bootstrapEditMode(id: string): void {
    // One-shot read — we don't subscribe to live store changes because
    // the form must stay stable while the user edits. If another tab
    // mutates the same holding mid-flow, we accept the user's pending
    // edit on save (last-write-wins, same as for tags).
    let snapshot: IHolding | undefined;
    this.store
      .select(selectHoldingsList)
      .subscribe((list) => {
        snapshot = list.find((h) => h.id === id);
      })
      .unsubscribe();

    if (!snapshot) {
      // Stale URL (deleted holding, refresh on a stranger's link). Bounce
      // back rather than render an empty edit form.
      this.snackBar.open('Holding not found', 'Dismiss', { duration: 3000 });
      this.router.navigate(['/savings']);
      return;
    }

    const instrument = this.instruments.getById(snapshot.instrumentId);
    const ac: AssetClass = instrument?.assetClass ?? AssetClass.OTHER;

    this.editing.set(snapshot);
    this.assetClass.set(ac);
    // Selected instrument is "the one we're editing against" — fixed
    // for the lifetime of the edit page.
    this.selectedInstrument.set(instrument ?? null);

    this.form.patchValue({
      assetClass: ac,
      symbol: instrument?.symbol ?? '',
      name: instrument?.name ?? '',
      quantity: snapshot.quantity,
      buyPrice: snapshot.averageBuyPrice,
      currency: snapshot.currency,
      accountId: snapshot.accountId ?? 'manual',
      tagIds: [...snapshot.tagIds],
    });

    // Lock the identity fields — switching class / symbol on an existing
    // Holding mid-edit silently turns it into "delete + create" which is
    // confusing. If the user wants that, they delete then add.
    this.form.get('assetClass')!.disable();
    this.form.get('symbol')!.disable();
    this.form.get('name')!.disable();
    // In edit mode we don't allow direct overwrite of quantity / buyPrice —
    // the user uses the "Top up" section below if they want to add more.
    this.form.get('quantity')!.disable();
    this.form.get('buyPrice')!.disable();
  }

  // ---- Derived ----

  public selectedAccount(): AccountChoice {
    const id = this.form?.get('accountId')?.value;
    return (
      this.accounts.find((a) => a.id === id) ?? this.accounts[0]
    );
  }

  public assetClassLabel(ac: AssetClass): string {
    switch (ac) {
      case AssetClass.STOCK:           return 'Stock';
      case AssetClass.ETF:             return 'ETF';
      case AssetClass.TOKENIZED_STOCK: return 'Tokenized stock';
      case AssetClass.CRYPTO:          return 'Crypto';
      case AssetClass.CASH:            return 'Cash';
      case AssetClass.DEPOSIT:         return 'Deposit';
      case AssetClass.REAL_ESTATE:     return 'Real estate';
      case AssetClass.OTHER:           return 'Other';
    }
  }

  public canSave(): boolean {
    if (!this.form || !this.form.valid) {
      return false;
    }
    // For Add mode the user must have an instrument selected (either
    // existing or freshly created inline). In Edit mode the instrument
    // came from the route and is fixed, so we skip this check.
    if (!this.isEditMode() && this.selectedInstrument() === null) {
      return false;
    }
    return true;
  }

  // ---- Autocomplete + create-custom flow ----

  public onInstrumentSelected(inst: IInstrument | null): void {
    this.selectedInstrument.set(inst);
    if (inst) {
      // Mirror into the form so the HoldingValidator.nonEmpty checks
      // for symbol/name pass. Sync currency suggestion if the form's
      // currency is still the default.
      this.form.patchValue({
        symbol: inst.symbol,
        name: inst.name,
      });
      if (!this.form.get('currency')?.dirty) {
        this.form.patchValue({ currency: inst.currency });
      }
    } else {
      this.form.patchValue({ symbol: '', name: '' });
    }
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

  // ---- Actions ----

  public onSave(): void {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.isEditMode()) {
      this.saveEdit();
    } else {
      this.saveAdd();
    }
  }

  private saveAdd(): void {
    const v = this.form.value as {
      assetClass: AssetClass;
      symbol: string;
      name: string;
      quantity: number;
      buyPrice: number;
      currency: string;
      accountId: string;
      tagIds: string[];
    };

    const account = this.accounts.find((a) => a.id === v.accountId)!;

    // The autocomplete / inline-create flow guarantees a selected
    // instrument by the time canSave() returns true. We use the
    // pre-resolved reference instead of getOrCreate to avoid an
    // accidental second instrument being created if the user typed
    // a slightly different symbol after picking.
    const instrument = this.selectedInstrument();
    if (!instrument) {
      // Shouldn't happen — canSave() guards this. Defensive return.
      return;
    }

    const now = new Date().toISOString();
    const holding: IHolding = {
      id: uuid(),
      instrumentId: instrument.id,
      accountId: account.id,
      accountName: account.name,
      accountKind: account.kind,
      quantity: Number(v.quantity),
      averageBuyPrice: Number(v.buyPrice),
      currency: v.currency,
      tagIds: v.tagIds ?? [],
      createdAt: now,
      updatedAt: now,
    };

    this.holdings.addHolding(holding);
    this.snackBar.open(`${instrument.symbol} added`, 'Dismiss', {
      duration: 3000,
    });
    this.router.navigate(['/savings']);
  }

  /**
   * Edit / top-up save. Distinguishes between:
   *   - Top-up:    addQuantity > 0 — reducer recomputes weighted avg.
   *   - Pure edit: addQuantity blank or 0 — only `patch` fields land.
   *
   * The disabled controls (assetClass/symbol/name/quantity/buyPrice)
   * are read via `form.getRawValue()` — `value` skips disabled fields.
   */
  private saveEdit(): void {
    const existing = this.editing();
    if (!existing) {
      return;
    }

    const raw = this.form.getRawValue() as {
      assetClass: AssetClass;
      symbol: string;
      name: string;
      quantity: number;
      buyPrice: number;
      currency: string;
      accountId: string;
      tagIds: string[];
      addQuantity: number | null;
      addBuyPrice: number | null;
    };

    const account = this.accounts.find((a) => a.id === raw.accountId)!;

    const addQty = Number(raw.addQuantity ?? 0);
    const addPrice = Number(raw.addBuyPrice ?? 0);
    const isTopUp = Number.isFinite(addQty) && addQty > 0;

    if (isTopUp && (!Number.isFinite(addPrice) || addPrice <= 0)) {
      this.snackBar.open(
        'Add buy-price must be positive when topping up',
        'Dismiss',
        { duration: 3000 },
      );
      return;
    }

    const patch: Partial<IHolding> = {
      accountId: account.id,
      accountName: account.name,
      accountKind: account.kind,
      currency: raw.currency,
      tagIds: raw.tagIds ?? [],
      updatedAt: new Date().toISOString(),
    };

    this.holdings.editHolding(
      existing.id,
      patch,
      isTopUp ? addQty : 0,
      isTopUp ? addPrice : 0,
    );

    const symbol =
      this.instruments.getById(existing.instrumentId)?.symbol ?? 'Holding';
    this.snackBar.open(
      isTopUp ? `${symbol} topped up` : `${symbol} updated`,
      'Dismiss',
      { duration: 3000 },
    );
    this.router.navigate(['/savings']);
  }

  public onCancel(): void {
    this.router.navigate(['/savings']);
  }
}
