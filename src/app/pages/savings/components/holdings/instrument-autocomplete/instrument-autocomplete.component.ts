import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import {
  AssetClass,
  isMarketBackedAssetClass,
} from '../../../../../domain/asset-class.domain';
import { IInstrument } from '../../../../../domain/instrument.domain';
import { InstrumentService } from '../../../service/instrument.service';

/**
 * Hand-curated TOP-N tickers shown as quick-pick chips when the field is
 * empty + focused. Saves the user from having to remember exact symbols
 * for the everyday cases. Tap on a chip → its symbol goes into the
 * search box and the standard debounced market-search kicks in
 * (no special path, no extra HTTP wiring).
 *
 * TODO (backend): replace with a `/api/v1/markets/{stocks|coins}/popular`
 * endpoint that returns top-N by query frequency from the
 * `instrument`-table. Until then this list is good enough to seed
 * pilot UX.
 */
const POPULAR_BY_CLASS: Record<AssetClass, ReadonlyArray<string>> = {
  [AssetClass.STOCK]: [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA',
    'META', 'TSLA', 'BRK.B', 'JPM', 'V',
    'MA', 'KO', 'PEP', 'WMT', 'DIS',
    'NFLX', 'XOM', 'BAC', 'INTC', 'AMD',
  ],
  [AssetClass.ETF]: [
    'SPY', 'VOO', 'VTI', 'QQQ', 'IVV',
    'VEA', 'VWO', 'BND', 'AGG', 'GLD',
  ],
  [AssetClass.TOKENIZED_STOCK]: [
    'AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN',
    'GOOGL', 'META', 'COIN',
  ],
  [AssetClass.CRYPTO]: [
    'BTC', 'ETH', 'USDT', 'BNB', 'SOL',
    'XRP', 'USDC', 'ADA', 'AVAX', 'DOGE',
  ],
  // Manual classes — no popular list, autocomplete uses local search +
  // Create custom path. Keys present to make `Record<AssetClass>` exhaustive.
  [AssetClass.CASH]: [],
  [AssetClass.DEPOSIT]: [],
  [AssetClass.REAL_ESTATE]: [],
  [AssetClass.OTHER]: [],
};

/**
 * Single-select autocomplete over the InstrumentService cache.
 *
 * Behaviour:
 *  - Lists existing instruments matching `assetClass`.
 *  - Filters by case-insensitive substring on `symbol` and `name`.
 *  - Last suggestion always offers "Create custom {symbol}" — emits
 *    `createCustom` with the typed query so the parent can open the
 *    inline create-form prefilled.
 *
 * The display string format is `{symbol} — {name}` so the user can
 * disambiguate identical symbols across classes (e.g. UAH cash vs a
 * future UAH stock listing). Returns `null` to the parent when the
 * field is cleared.
 *
 * We use a plain `@Input/@Output` pair instead of ControlValueAccessor
 * — same rationale as `pgz-tag-chips` (PR4 §10 risk #1 flagged CVA as
 * non-trivial and the parent form handles the FormControl wiring itself).
 */
@Component({
  selector: 'pgz-instrument-autocomplete',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './instrument-autocomplete.component.html',
  styleUrl: './instrument-autocomplete.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstrumentAutocompleteComponent implements OnChanges {
  private readonly instruments = inject(InstrumentService);
  private readonly destroyRef = inject(DestroyRef);

  // ---- Inputs / outputs ----

  /** Limits suggestions to this AssetClass. Required — null isn't supported
   *  because the parent form always has an asset class picked first. */
  @Input({ required: true }) public assetClass!: AssetClass;

  /**
   * Snapshot of `assetClass` exposed as a signal so the rest of this
   * component (computed mode, market-search pipeline) reads it reactively.
   * Updated in `ngOnChanges` whenever the parent rebinds the input.
   */
  private readonly _assetClass = signal<AssetClass | null>(null);

  /** Currently selected instrument, or null. */
  @Input()
  public set value(v: IInstrument | null) {
    this._value.set(v);
    if (v) {
      this.searchCtrl.setValue(this.displayWith(v), { emitEvent: false });
    }
  }
  public get value(): IInstrument | null {
    return this._value();
  }
  private readonly _value = signal<IInstrument | null>(null);

  /** Disable to lock the field (edit mode — instrument is fixed). */
  @Input() public disabled = false;

  @Output() public readonly valueChange = new EventEmitter<IInstrument | null>();

  /** Fired when the user picks "Create custom" — payload is the typed
   *  query so the parent can prefill the inline form with a symbol. */
  @Output() public readonly createCustom = new EventEmitter<string>();

  // ---- State ----

  public readonly searchCtrl = new FormControl<string>('', { nonNullable: true });

  private readonly query = signal<string>('');

  /** True when the current AssetClass has a backend market-search
   *  provider behind it (STOCK/ETF/CRYPTO/TOKENIZED_STOCK). Drives whether
   *  we use the HTTP pipeline or the legacy sync local search. */
  public readonly isMarketMode = computed<boolean>(() => {
    const ac = this._assetClass();
    return ac !== null && isMarketBackedAssetClass(ac);
  });

  /** Latest HTTP search results — replaces local `search()` output when
   *  in market mode. */
  private readonly _marketResults = signal<IInstrument[]>([]);

  /** Loading indicator for the dropdown spinner — turned on at the very
   *  start of a debounced cycle, off when the HTTP call resolves. */
  public readonly isLoading = signal<boolean>(false);

  /** Last response's `stale` flag (true when backend returned cached
   *  results because the upstream API was unavailable / rate-limited). */
  public readonly isStale = signal<boolean>(false);

  /** Inbound query stream for the market-search pipeline. We can't
   *  pipe `searchCtrl.valueChanges` directly because it also fires
   *  when we programmatically write the display string after selection;
   *  the dedicated Subject is fed from the manual valueChanges handler
   *  below only when the typed value is meaningfully different. */
  private readonly queryStream$ = new Subject<{ q: string; assetClass: AssetClass }>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['assetClass']) {
      this._assetClass.set(this.assetClass);
      // Switching class invalidates the current market suggestions.
      this._marketResults.set([]);
      this.isStale.set(false);
    }
    if (changes['disabled']) {
      if (this.disabled) {
        this.searchCtrl.disable({ emitEvent: false });
      } else {
        this.searchCtrl.enable({ emitEvent: false });
      }
    }
  }

  constructor() {
    // Manual valueChanges handler — keeps the existing UX (clear-on-edit)
    // and feeds the market-search pipeline. We do NOT subscribe in a
    // single chain because `displayWith` writes the chosen instrument's
    // text into the field after select, and we don't want that write
    // to re-trigger a search.
    this.searchCtrl.valueChanges.subscribe((v) => {
      const text = v ?? '';
      this.query.set(text);

      // Clear the selection if the user is typing freeform — they no
      // longer have the previously-picked instrument in mind.
      if (this._value() && text !== this.displayWith(this._value()!)) {
        this._value.set(null);
        this.valueChange.emit(null);
      }

      // Feed market pipeline only when we're in market mode. Manual
      // classes stay on sync local search and don't hit HTTP at all.
      const ac = this._assetClass();
      if (ac !== null && isMarketBackedAssetClass(ac)) {
        // Optimistic spinner — turned off when the debounced call
        // resolves or short-circuits below.
        if (text.trim().length > 0) {
          this.isLoading.set(true);
        }
        this.queryStream$.next({ q: text, assetClass: ac });
      }
    });

    // Single market-search pipeline: debounce → switchMap (which auto-
    // cancels in-flight calls when a newer query arrives). Empty queries
    // short-circuit to an immediate clear of the results list without
    // hitting HTTP.
    this.queryStream$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(
          (a, b) => a.q === b.q && a.assetClass === b.assetClass,
        ),
        switchMap(({ q, assetClass }) => {
          if (q.trim().length === 0) {
            this.isLoading.set(false);
            this._marketResults.set([]);
            this.isStale.set(false);
            // Return a no-op observable so switchMap keeps the chain alive.
            return this.instruments.searchMarket(q, assetClass);
          }
          return this.instruments.searchMarket(q, assetClass);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((res) => {
        this._marketResults.set(res.results);
        this.isStale.set(res.stale);
        this.isLoading.set(false);
      });
  }

  // ---- Derived ----

  /** What the dropdown actually shows:
   *  - market mode → HTTP results (already filtered + ranked by backend);
   *  - manual mode → sync local search over the InstrumentService cache. */
  public readonly suggestions = computed<IInstrument[]>(() => {
    if (this.isMarketMode()) {
      return this._marketResults();
    }
    return this.instruments
      .search(this.query(), this.assetClass)
      .slice(0, 20);
  });

  public readonly showCreateCta = computed<boolean>(() => {
    return this.query().trim().length > 0;
  });

  /** Whether the × clear button should render — only when there's
   *  something to clear (typed text or selected instrument) and the
   *  field isn't disabled. */
  public readonly showClear = computed<boolean>(() => {
    if (this.disabled) {
      return false;
    }
    return this._value() !== null || this.query().trim().length > 0;
  });

  /** Curated quick-pick tickers for the current AssetClass. Shown
   *  underneath the input when the user hasn't typed anything yet and
   *  no instrument is selected — saves them from having to remember
   *  exact symbols. Empty array for manual classes (no popular list). */
  public readonly popularTickers = computed<ReadonlyArray<string>>(() => {
    const ac = this._assetClass();
    if (!ac) {
      return [];
    }
    return POPULAR_BY_CLASS[ac] ?? [];
  });

  /** Show the popular row only when:
   *   - in market mode (manual classes don't have a curated list);
   *   - nothing is selected yet;
   *   - the search box is empty;
   *   - the curated list is non-empty for the current class. */
  public readonly showPopular = computed<boolean>(() => {
    if (this.disabled) return false;
    if (!this.isMarketMode()) return false;
    if (this._value() !== null) return false;
    if (this.query().trim().length > 0) return false;
    return this.popularTickers().length > 0;
  });

  // ---- Actions ----

  public onSelect(event: MatAutocompleteSelectedEvent): void {
    const val = event.option.value;
    if (!val) {
      // null = Create-custom CTA (handled via (click) in template).
      return;
    }
    if (typeof val === 'string') {
      // String value = popular-ticker quick-pick. Material auto-fills
      // the input with `displayWith(val) = val`, which fires
      // valueChanges, which feeds the debounced market pipeline. We
      // don't manually set anything here — just bail.
      return;
    }
    this._value.set(val as IInstrument);
    this.valueChange.emit(val as IInstrument);
  }

  public onCreateCustom(): void {
    const symbolGuess = this.query().trim();
    this.createCustom.emit(symbolGuess);
  }

  /** × button — clears both the selection and the typed text. */
  public onClear(): void {
    this._value.set(null);
    this.valueChange.emit(null);
    this.searchCtrl.setValue('', { emitEvent: true });
    this._marketResults.set([]);
    this.isStale.set(false);
  }

  /** Tap a popular-ticker option inside the dropdown → Material's
   *  `displayWith` writes the symbol into the input automatically,
   *  which fires `searchCtrl.valueChanges` and triggers the standard
   *  debounced market-search pipeline. The user then picks the actual
   *  exchange-disambiguated result on the next dropdown render
   *  (AAPL.US vs AAPL.TRT etc). No explicit handler needed — the
   *  string value flow does the job. */

  public displayWith = (inst: IInstrument | string | null): string => {
    if (!inst || typeof inst === 'string') {
      return (inst as string) ?? '';
    }
    return `${inst.symbol} — ${inst.name}`;
  };
}
