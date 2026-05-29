import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
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
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { PageHeaderComponent } from '../../../../../core/UI/components/page-header/page-header.component';
import { ILoopPosition } from '../../../../../domain/loop-position.domain';
import { SUPPORTED_BASE_CURRENCIES } from '../../../../../domain/user-preferences.domain';
import { FxRateService } from '../../../../../service/fx-rate.service';
import { LoopingService } from '../../../../../service/looping.service';
import { LoopValidator } from '../../../validator/LoopValidator';
import { UserPreferencesService } from '../../../service/user-preferences.service';
import { LoopCardComponent } from '../loop-card/loop-card.component';

interface ProtocolPreset {
  thr: number;
  penalty: number;
  emodeThr?: number;
  emodePenalty?: number;
}

/**
 * Smart presets for liquidation threshold + penalty by protocol (+ e-mode),
 * per the design rationale (mockup savings/17): users rarely know LLTV /
 * penalty off-hand, and the threshold drives ALL risk stats — so we never
 * leave it blank. Penalty default ~1% (e-mode) / 5–8% (volatile pairs).
 */
const LOOP_PROTOCOL_PRESETS: Readonly<Record<string, ProtocolPreset>> = {
  'Aave v3': { thr: 83, penalty: 5, emodeThr: 95, emodePenalty: 1 },
  Morpho: { thr: 91.5, penalty: 5 },
  Kamino: { thr: 80, penalty: 5 },
  Contango: { thr: 90, penalty: 2 },
  Gearbox: { thr: 90, penalty: 4 },
};

const PROTOCOL_OPTIONS = ['Aave v3', 'Morpho', 'Kamino', 'Contango', 'Gearbox', 'Other'];
const CHAIN_OPTIONS = ['Ethereum', 'Arbitrum', 'Base', 'Optimism', 'Solana', 'Other'];

/**
 * Add / edit a looping (Strategy) position (mockup savings/17 ·
 * `docs/notes/2026-05-add-loop-instrument-task.md`). The user enters only
 * inputs (Identity / Size / Yield / Risk); every stat is derived and shown
 * live in the `pgz-loop-card` preview. Persists to the localStorage
 * `LoopingService` — anonymous, offline (ADR-0012). Read-only tracking: the
 * form records a position, it never executes anything.
 */
@Component({
  selector: 'pgz-add-loop',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatIconModule,
    MatTooltipModule,
    PageHeaderComponent,
    LoopCardComponent,
  ],
  templateUrl: './add-loop.component.html',
  styleUrl: './add-loop.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddLoopComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly loopingService = inject(LoopingService);
  private readonly userPrefs = inject(UserPreferencesService);
  private readonly fxRate = inject(FxRateService);
  private readonly destroyRef = inject(DestroyRef);

  public form!: FormGroup;

  public readonly protocols = PROTOCOL_OPTIONS;
  public readonly chains = CHAIN_OPTIONS;
  public readonly currencies: ReadonlyArray<string> = SUPPORTED_BASE_CURRENCIES;

  /** Display (base) currency for the live preview card. */
  public readonly displayCurrency = computed<string>(
    () => this.userPrefs.baseCurrency() ?? 'USD',
  );

  public readonly emodeTooltip =
    'Collateral & debt move together (e.g. wstETH/ETH) → higher liquidation threshold, so more safe leverage.';

  private editingId: number | null = null;
  public get isEdit(): boolean {
    return this.editingId != null;
  }

  /** Live-recomputed draft → fed to the preview `pgz-loop-card`. */
  private readonly _draft = signal<ILoopPosition | null>(null);
  public readonly draft = this._draft.asReadonly();

  public ngOnInit(): void {
    const base = (this.userPrefs.baseCurrency() ?? 'USD').toUpperCase();
    this.fxRate
      .preload(base, [...SUPPORTED_BASE_CURRENCIES])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();

    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam != null ? Number(idParam) : NaN;
    const existing = Number.isFinite(id)
      ? this.loopingService.snapshot().find((l) => l.id === id) ?? null
      : null;
    this.editingId = existing?.id ?? null;

    const today = new Date().toISOString().slice(0, 10);
    this.form = this.fb.group(
      {
        protocol: [existing?.protocol ?? 'Aave v3', Validators.required],
        chain: [existing?.chain ?? 'Ethereum'],
        collateralAsset: [existing?.collateralAsset ?? '', Validators.required],
        debtAsset: [existing?.debtAsset ?? '', Validators.required],
        eMode: [existing?.eMode ?? false],
        openedAt: [
          existing?.openedAt?.slice(0, 10) ?? today,
          [Validators.required, LoopValidator.notFutureDate],
        ],
        initialCapital: [
          existing?.initialCapital ?? null,
          [Validators.required, Validators.min(0.01)],
        ],
        loopRounds: [existing?.loopRounds ?? null],
        totalCollateral: [
          existing?.totalCollateral ?? null,
          [Validators.required, Validators.min(0)],
        ],
        totalDebt: [
          existing?.totalDebt ?? null,
          [Validators.required, Validators.min(0)],
        ],
        currency: [existing?.currency ?? base, Validators.required],
        supplyApy: [existing?.supplyApy ?? null, [Validators.required, Validators.min(0)]],
        borrowApy: [existing?.borrowApy ?? null, [Validators.required, Validators.min(0)]],
        liquidationThreshold: [
          existing?.liquidationThreshold ?? null,
          [LoopValidator.liqThreshold],
        ],
        liquidationPenalty: [
          existing?.liquidationPenalty ?? null,
          [LoopValidator.percentMax(100)],
        ],
        notes: [existing?.notes ?? ''],
      },
      { validators: [LoopValidator.equityPositive] },
    );

    if (existing) {
      // Saved values are user-owned — mark risk fields dirty so the protocol
      // presets don't overwrite them on edit.
      this.form.get('liquidationThreshold')?.markAsDirty();
      this.form.get('liquidationPenalty')?.markAsDirty();
    } else {
      this.applyPresets();
    }
    this._draft.set(this.buildDraft());

    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.applyPresets();
        this._draft.set(this.buildDraft());
      });
  }

  /** True while the risk fields still carry an auto-filled protocol preset. */
  public get presetActive(): boolean {
    const ctrl = this.form?.get('liquidationThreshold');
    const protocol = this.form?.get('protocol')?.value as string;
    return !!ctrl && !ctrl.dirty && !!LOOP_PROTOCOL_PRESETS[protocol];
  }

  /** Auto-fill threshold + penalty from protocol (+ e-mode) while untouched. */
  private applyPresets(): void {
    const protocol = this.form.get('protocol')?.value as string;
    const eMode = !!this.form.get('eMode')?.value;
    const preset = LOOP_PROTOCOL_PRESETS[protocol];
    if (!preset) return;
    const thr = eMode && preset.emodeThr != null ? preset.emodeThr : preset.thr;
    const pen =
      eMode && preset.emodePenalty != null ? preset.emodePenalty : preset.penalty;
    const thrCtrl = this.form.get('liquidationThreshold');
    const penCtrl = this.form.get('liquidationPenalty');
    if (thrCtrl && !thrCtrl.dirty) thrCtrl.setValue(thr, { emitEvent: false });
    if (penCtrl && !penCtrl.dirty) penCtrl.setValue(pen, { emitEvent: false });
  }

  private num(v: unknown): number {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  private buildDraft(): ILoopPosition {
    const v = this.form.getRawValue();
    return {
      protocol: (v.protocol ?? '').trim(),
      chain: (v.chain ?? '').trim() || undefined,
      collateralAsset: (v.collateralAsset ?? '').trim(),
      debtAsset: (v.debtAsset ?? '').trim(),
      eMode: !!v.eMode,
      loopRounds:
        v.loopRounds != null && v.loopRounds !== '' ? this.num(v.loopRounds) : undefined,
      openedAt: v.openedAt || new Date().toISOString().slice(0, 10),
      totalCollateral: this.num(v.totalCollateral),
      totalDebt: this.num(v.totalDebt),
      currency: v.currency,
      initialCapital: this.num(v.initialCapital),
      supplyApy: this.num(v.supplyApy),
      borrowApy: this.num(v.borrowApy),
      liquidationThreshold: this.num(v.liquidationThreshold),
      liquidationPenalty:
        v.liquidationPenalty != null && v.liquidationPenalty !== ''
          ? this.num(v.liquidationPenalty)
          : undefined,
      notes: (v.notes ?? '').trim() || undefined,
    };
  }

  public save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Check the highlighted fields', 'Dismiss', {
        duration: 3000,
      });
      return;
    }
    const loop = this.buildDraft();
    loop.isSaved = false;
    if (this.editingId != null) {
      loop.id = this.editingId;
      this.loopingService.updateLoop(loop);
      this.snackBar.open('Strategy updated', 'Dismiss', { duration: 3000 });
    } else {
      this.loopingService.addLoop(loop);
      this.snackBar.open('Strategy added', 'Dismiss', { duration: 3000 });
    }
    this.router.navigate(['/savings']);
  }

  public prevRoute(): void {
    this.router.navigate(['/savings']);
  }
}
