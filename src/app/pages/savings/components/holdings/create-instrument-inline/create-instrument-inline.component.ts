import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AssetClass } from '../../../../../domain/asset-class.domain';
import {
  IInstrument,
  InstrumentMetadata,
  RealEstatePropertyType,
} from '../../../../../domain/instrument.domain';
import { InstrumentService } from '../../../service/instrument.service';
import { HoldingValidator } from '../../../validator/HoldingValidator';

interface CreateOutput {
  instrument: IInstrument;
}

/**
 * Inline form for creating a custom Instrument, embedded inside
 * AddHoldingComponent when the autocomplete returned no match for the
 * typed query. Fields adapt to AssetClass per `2026-05-pr4-crud-holdings-
 * task.md` §4 table.
 *
 * Supported class-specific metadata (PR4 doc §4 table, condensed to
 * the 7 current AssetClass values — extended once ADR-0001 update
 * adds ETF / MUTUAL_FUND / BOND / COMMODITY / P2P_LOAN):
 *
 *   STOCK             — exchange, country?, sector?
 *   TOKENIZED_STOCK   — underlyingSymbol, exchange, blockchain
 *   CRYPTO            — coinId? (defaults to lowercased symbol)
 *   CASH              — (symbol auto-syncs to currency)
 *   DEPOSIT           — interestRate, maturityDate?
 *   REAL_ESTATE       — country?, propertyType?
 *   OTHER             — (no extras)
 */
@Component({
  selector: 'pgz-create-instrument-inline',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './create-instrument-inline.component.html',
  styleUrl: './create-instrument-inline.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateInstrumentInlineComponent implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly instruments = inject(InstrumentService);

  // ---- Inputs / outputs ----

  /** AssetClass the new instrument belongs to. Required. */
  @Input({ required: true }) public assetClass!: AssetClass;

  /** Pre-fill the symbol from the autocomplete query. */
  @Input() public initialSymbol = '';

  /** Pre-fill the default currency (from parent form). */
  @Input() public initialCurrency = 'USD';

  @Output() public readonly created = new EventEmitter<CreateOutput>();
  @Output() public readonly cancelled = new EventEmitter<void>();

  public form!: FormGroup;

  /** Mirror of `assetClass` Input as a signal — drives the
   *  per-class extra-fields block in the template. */
  public readonly cls = signal<AssetClass>(AssetClass.STOCK);

  // Pre-baked option lists.
  public readonly currencies: ReadonlyArray<string> = [
    'USD', 'EUR', 'UAH', 'PLN', 'GBP',
  ];
  public readonly propertyTypes: ReadonlyArray<RealEstatePropertyType> = [
    'APARTMENT', 'HOUSE', 'LAND', 'COMMERCIAL', 'OTHER',
  ];

  // Reactive convenience getters for the template.
  public readonly showExchange = computed<boolean>(() => {
    return this.cls() === AssetClass.STOCK || this.cls() === AssetClass.TOKENIZED_STOCK;
  });
  public readonly showTokenized = computed<boolean>(() => {
    return this.cls() === AssetClass.TOKENIZED_STOCK;
  });
  public readonly showDeposit = computed<boolean>(() => {
    return this.cls() === AssetClass.DEPOSIT;
  });
  public readonly showRealEstate = computed<boolean>(() => {
    return this.cls() === AssetClass.REAL_ESTATE;
  });

  ngOnInit(): void {
    this.cls.set(this.assetClass);
    const isCash = this.assetClass === AssetClass.CASH;
    const defaultSymbol = isCash
      ? this.initialCurrency
      : this.initialSymbol.trim().toUpperCase();
    const defaultName = isCash ? `${this.initialCurrency} Cash` : '';

    this.form = this.fb.group({
      symbol:           [defaultSymbol, HoldingValidator.nonEmpty],
      name:             [defaultName, HoldingValidator.nonEmpty],
      currency:         [this.initialCurrency, Validators.required],
      // STOCK / TOKENIZED_STOCK
      exchange:         [''],
      // TOKENIZED_STOCK
      underlyingSymbol: [''],
      blockchain:       [''],
      // DEPOSIT
      interestRate:     [null],
      maturityDate:     [''],
      // REAL_ESTATE
      country:          [''],
      propertyType:     [''],
    });

    // CASH special: symbol mirrors currency so user doesn't need to
    // type "USD" twice. The user can still override if they want.
    if (isCash) {
      this.form.get('currency')!.valueChanges.subscribe((c) => {
        if (!c) return;
        this.form.patchValue(
          { symbol: c, name: `${c} Cash` },
          { emitEvent: false },
        );
      });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['assetClass'] && this.form) {
      this.cls.set(this.assetClass);
    }
  }

  // ---- Actions ----

  public onSave(): void {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.value as {
      symbol: string;
      name: string;
      currency: string;
      exchange: string;
      underlyingSymbol: string;
      blockchain: string;
      interestRate: number | null;
      maturityDate: string;
      country: string;
      propertyType: RealEstatePropertyType | '';
    };

    const instrument = this.instruments.getOrCreate({
      symbol: v.symbol.trim().toUpperCase(),
      assetClass: this.assetClass,
      name: v.name.trim(),
      currency: v.currency,
      metadata: this.buildMetadata(v),
    });

    this.created.emit({ instrument });
  }

  public onCancel(): void {
    this.cancelled.emit();
  }

  /**
   * Builds the InstrumentMetadata variant matching the current AssetClass.
   * Empty / blank optional fields are stripped so the discriminated
   * union stays well-formed.
   */
  private buildMetadata(v: {
    symbol: string;
    name: string;
    currency: string;
    exchange: string;
    underlyingSymbol: string;
    blockchain: string;
    interestRate: number | null;
    maturityDate: string;
    country: string;
    propertyType: RealEstatePropertyType | '';
  }): InstrumentMetadata {
    switch (this.assetClass) {
      case AssetClass.STOCK:
        return {
          kind: AssetClass.STOCK,
          exchange: v.exchange.trim() || 'MANUAL',
          currency: v.currency,
          ...(v.country.trim() ? { country: v.country.trim() } : {}),
        };
      case AssetClass.ETF:
        return {
          kind: AssetClass.ETF,
          exchange: v.exchange.trim() || 'MANUAL',
          currency: v.currency,
          ...(v.country.trim() ? { country: v.country.trim() } : {}),
        };
      case AssetClass.TOKENIZED_STOCK:
        return {
          kind: AssetClass.TOKENIZED_STOCK,
          underlyingSymbol: v.underlyingSymbol.trim().toUpperCase(),
          tokenSymbol: v.symbol.trim().toUpperCase(),
          exchange: v.exchange.trim() || 'MANUAL',
          blockchain: v.blockchain.trim() || 'Ethereum',
        };
      case AssetClass.CRYPTO:
        return {
          kind: AssetClass.CRYPTO,
          coinId: v.symbol.trim().toLowerCase(),
        };
      case AssetClass.CASH:
        return { kind: AssetClass.CASH, currency: v.currency };
      case AssetClass.DEPOSIT:
        return {
          kind: AssetClass.DEPOSIT,
          currency: v.currency,
          interestRate: Number(v.interestRate ?? 0),
          ...(v.maturityDate ? { maturityDate: v.maturityDate } : {}),
        };
      case AssetClass.REAL_ESTATE:
        return {
          kind: AssetClass.REAL_ESTATE,
          currency: v.currency,
          ...(v.country.trim() ? { country: v.country.trim() } : {}),
          ...(v.propertyType
            ? { propertyType: v.propertyType }
            : {}),
        };
      case AssetClass.OTHER:
        return { kind: AssetClass.OTHER, currency: v.currency };
    }
  }
}
