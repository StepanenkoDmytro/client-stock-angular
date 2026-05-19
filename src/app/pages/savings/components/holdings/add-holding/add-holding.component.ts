import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { v4 as uuid } from 'uuid';
import {
  AssetClass,
} from '../../../../../domain/asset-class.domain';
import { IHolding } from '../../../../../domain/holding.domain';
import { IInstrument } from '../../../../../domain/instrument.domain';
import { PrevRouteComponent } from '../../../../../core/UI/components/prev-route/prev-route.component';
import {
  AddHoldingArchetype,
  ArchetypeInitialValue,
  ArchetypeInitialValueManualCreate,
  ArchetypeInitialValueMarketBacked,
  ArchetypeInitialValueSingleAmount,
  ArchetypeState,
  ArchetypeSubmission,
  archetypeForClass,
  assetClassFromSlug,
} from '../../../model/AddHoldingArchetype';
import { HoldingService } from '../../../service/holding.service';
import { InstrumentService } from '../../../service/instrument.service';
import { TagsService } from '../../../service/tags.service';
import { selectHoldingsList } from '../../../store/holdings.selectors';
import { ArchetypeMarketBackedComponent } from './archetypes/archetype-market-backed/archetype-market-backed.component';
import { ArchetypeManualCreateComponent } from './archetypes/archetype-manual-create/archetype-manual-create.component';
import { ArchetypeSingleAmountComponent } from './archetypes/archetype-single-amount/archetype-single-amount.component';
import { ClassChipBreadcrumbComponent } from './class-chip-breadcrumb/class-chip-breadcrumb.component';
import { TopupPanelComponent, TopupSubmission } from './topup-panel/topup-panel.component';

/**
 * Add / Edit Holding orchestrator. Renders the chip breadcrumb + one of
 * three archetype components (Market-backed / Manual-create / Single-
 * amount) + a shared footer. Edit-mode reuses the same scaffold —
 * archetype receives `initialValue` + `readOnlyInstrument` and the chip
 * is non-interactive. A standalone {@link TopupPanelComponent} appears
 * below the archetype in edit-mode for weighted-average top-ups.
 *
 * <p>Per `docs/notes/2026-05-edit-holding-unify.md` §2 — add and edit
 * are the same layout, only differing in chip interactivity, instrument
 * lock, and Save dispatch (POST vs PUT).
 */
@Component({
  selector: 'pgz-add-holding',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    PrevRouteComponent,
    ClassChipBreadcrumbComponent,
    ArchetypeMarketBackedComponent,
    ArchetypeManualCreateComponent,
    ArchetypeSingleAmountComponent,
    TopupPanelComponent,
  ],
  templateUrl: './add-holding.component.html',
  styleUrl: './add-holding.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddHoldingComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(Store);
  private readonly snackBar = inject(MatSnackBar);
  private readonly holdings = inject(HoldingService);
  private readonly instruments = inject(InstrumentService);
  private readonly tags = inject(TagsService);

  /** Edit-mode holding (when route param `:id` was present and matched). */
  private readonly editing = signal<IHolding | null>(null);

  public readonly isEditMode = computed<boolean>(() => this.editing() !== null);

  public readonly title = computed<string>(() =>
    this.isEditMode() ? 'Edit saving' : 'Add saving',
  );

  public readonly assetClass = signal<AssetClass>(AssetClass.STOCK);

  public readonly archetype = computed<AddHoldingArchetype>(() =>
    archetypeForClass(this.assetClass()),
  );

  /** Expose enum to the template's `@switch`. */
  public readonly Archetype = AddHoldingArchetype;

  /** Edit-mode seed for the active archetype. Null in add-mode. */
  public readonly archetypeInitialValue = signal<ArchetypeInitialValue | null>(null);

  /** Edit-mode locked instrument (read-only display in the archetype). */
  public readonly readOnlyInstrument = signal<IInstrument | null>(null);

  /** Latest state from the active archetype — drives Save button + dispatch. */
  public readonly archetypeState = signal<ArchetypeState>({
    valid: false,
    submission: null,
  });

  public readonly archetypeCanSave = computed<boolean>(
    () => this.archetypeState().valid,
  );

  /**
   * Sticky flag: becomes {@code true} the first time the active archetype
   * reaches a valid submission. Drives the change-class confirm prompt.
   */
  private readonly hasFormChanges = signal<boolean>(false);

  // ---- Narrowed initialValue accessors (template-friendly) ----

  public readonly initialMarketBacked = computed<ArchetypeInitialValueMarketBacked | null>(() => {
    const v = this.archetypeInitialValue();
    return v && v.kind === AddHoldingArchetype.MARKET_BACKED ? v : null;
  });

  public readonly initialManualCreate = computed<ArchetypeInitialValueManualCreate | null>(() => {
    const v = this.archetypeInitialValue();
    return v && v.kind === AddHoldingArchetype.MANUAL_CREATE ? v : null;
  });

  public readonly initialSingleAmount = computed<ArchetypeInitialValueSingleAmount | null>(() => {
    const v = this.archetypeInitialValue();
    return v && v.kind === AddHoldingArchetype.SINGLE_AMOUNT ? v : null;
  });

  ngOnInit(): void {
    this.tags.init();
    this.instruments.init();
    this.holdings.init();

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.bootstrapEditMode(idParam);
      return;
    }

    const classSlug = this.route.snapshot.paramMap.get('class');
    if (classSlug) {
      const ac = assetClassFromSlug(classSlug);
      if (ac) {
        this.assetClass.set(ac);
      } else {
        this.router.navigate(['/savings/add-holding']);
      }
    }
  }

  public onArchetypeStateChange(state: ArchetypeState): void {
    this.archetypeState.set(state);
    if (state.valid || state.submission !== null) {
      this.hasFormChanges.set(true);
    }
  }

  public onChangeClass(): void {
    if (this.hasFormChanges()) {
      const ok = typeof window !== 'undefined' && typeof window.confirm === 'function'
        ? window.confirm('Discard the changes you entered for this asset class?')
        : true;
      if (!ok) return;
    }
    this.router.navigate(['/savings/add-holding']);
  }

  public onSave(): void {
    const sub = this.archetypeState().submission;
    if (!sub) return;
    if (this.isEditMode()) {
      this.saveEdit(sub);
    } else {
      this.saveAdd(sub);
    }
  }

  public onTopupSubmitted(payload: TopupSubmission): void {
    const existing = this.editing();
    if (!existing) return;
    this.holdings.topUp(existing.id, {
      addQuantity: payload.addQuantity,
      addBuyPrice: payload.addBuyPrice,
    });
    const symbol =
      this.instruments.getById(existing.instrumentId)?.symbol ?? 'Holding';
    this.snackBar.open(`${symbol} topped up`, 'Dismiss', { duration: 3000 });
    this.router.navigate(['/savings']);
  }

  public onCancel(): void {
    this.router.navigate(['/savings']);
  }

  // ---- internal ----

  private saveAdd(sub: ArchetypeSubmission): void {
    const holding = this.toHolding(sub);
    this.holdings.addHolding(holding);
    this.snackBar.open(`${sub.instrument.symbol} added`, 'Dismiss', {
      duration: 3000,
    });
    this.router.navigate(['/savings']);
  }

  private saveEdit(sub: ArchetypeSubmission): void {
    const existing = this.editing();
    if (!existing) return;

    this.holdings.update(existing.id, {
      quantity: sub.quantity,
      averageBuyPrice: sub.averageBuyPrice,
      currency: sub.currency,
    });

    const symbol = sub.instrument.symbol;
    this.snackBar.open(`${symbol} updated`, 'Dismiss', { duration: 3000 });
    this.router.navigate(['/savings']);
  }

  private toHolding(sub: ArchetypeSubmission): IHolding {
    const now = new Date().toISOString();
    return {
      id: uuid(),
      instrumentId: sub.instrument.id,
      accountId: sub.accountId,
      accountName: sub.accountName,
      accountKind: sub.accountKind,
      quantity: sub.quantity,
      averageBuyPrice: sub.averageBuyPrice,
      currency: sub.currency,
      tagIds: sub.tagIds,
      createdAt: now,
      updatedAt: now,
      ...(sub.lockMeta ? { lockMeta: sub.lockMeta } : {}),
    };
  }

  /**
   * Edit-mode bootstrap: find the holding by id, resolve its instrument,
   * derive the archetype, and assemble an {@link ArchetypeInitialValue}
   * to feed into the archetype component. Bounces to /savings if the id
   * is stale.
   */
  private bootstrapEditMode(id: string): void {
    let snapshot: IHolding | undefined;
    this.store
      .select(selectHoldingsList)
      .subscribe((list) => {
        snapshot = list.find((h) => h.id === id);
      })
      .unsubscribe();

    if (!snapshot) {
      this.snackBar.open('Holding not found', 'Dismiss', { duration: 3000 });
      this.router.navigate(['/savings']);
      return;
    }

    const instrument = this.instruments.getById(snapshot.instrumentId);
    if (!instrument) {
      this.snackBar.open('Instrument missing', 'Dismiss', { duration: 3000 });
      this.router.navigate(['/savings']);
      return;
    }

    const ac = instrument.assetClass;
    this.editing.set(snapshot);
    this.assetClass.set(ac);
    this.readOnlyInstrument.set(instrument);
    this.archetypeInitialValue.set(this.buildInitialValue(ac, snapshot, instrument));
  }

  private buildInitialValue(
    ac: AssetClass,
    holding: IHolding,
    instrument: IInstrument,
  ): ArchetypeInitialValue {
    const accountId = holding.accountId ?? 'manual';
    const lockMeta = holding.lockMeta ?? null;
    const tagIds = [...holding.tagIds];
    const archetype = archetypeForClass(ac);
    switch (archetype) {
      case AddHoldingArchetype.MARKET_BACKED:
        return {
          kind: AddHoldingArchetype.MARKET_BACKED,
          instrument,
          quantity: holding.quantity,
          averageBuyPrice: holding.averageBuyPrice,
          accountId,
          lockMeta,
          tagIds,
        };
      case AddHoldingArchetype.MANUAL_CREATE:
        return {
          kind: AddHoldingArchetype.MANUAL_CREATE,
          instrument,
          quantity: holding.quantity,
          averageBuyPrice: holding.averageBuyPrice,
          accountId,
          lockMeta,
          tagIds,
        };
      case AddHoldingArchetype.SINGLE_AMOUNT:
        return {
          kind: AddHoldingArchetype.SINGLE_AMOUNT,
          currency: holding.currency,
          amount: holding.quantity,
          accountId,
          lockMeta,
          tagIds,
        };
    }
  }

  /** Current quantity / avg-price for the topup-panel preview. */
  public currentQuantity(): number {
    return this.editing()?.quantity ?? 0;
  }

  public currentAveragePrice(): number {
    return this.editing()?.averageBuyPrice ?? 0;
  }

  public currentCurrency(): string {
    return this.editing()?.currency ?? '';
  }
}
