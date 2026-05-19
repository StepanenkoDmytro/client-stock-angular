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
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

/**
 * Standalone Top-up panel — extracted from the legacy edit-mode form of
 * `AddHoldingComponent`. Lives below the archetype switch when editing an
 * existing holding (`/savings/edit-holding/:id`).
 *
 * <p>Owns a tiny reactive form: {@code addQuantity} + {@code addBuyPrice},
 * both positive. Renders a live "new average buy price" preview using the
 * same weighted-average formula the backend applies on POST
 * {@code /api/v1/holdings/&lcub;id&rcub;/top-up} (ADR-0001).
 *
 * <p>Emits {@code (submitted)} only when both fields are valid and the user
 * clicks Apply — the parent is responsible for dispatching the REST call.
 */
export interface TopupSubmission {
  addQuantity: number;
  addBuyPrice: number;
}

@Component({
  selector: 'pgz-topup-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './topup-panel.component.html',
  styleUrl: './topup-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopupPanelComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  /** Current quantity of the holding — drives the avg-price preview. */
  @Input({ required: true }) public currentQuantity = 0;

  /** Current average buy price — drives the preview. */
  @Input({ required: true }) public currentAveragePrice = 0;

  /** Display currency for the preview line (typically holding.currency). */
  @Input() public currency = '';

  @Output() public submitted = new EventEmitter<TopupSubmission>();

  public form!: FormGroup;

  private readonly formValue = signal<{ addQuantity: number | null; addBuyPrice: number | null }>(
    { addQuantity: null, addBuyPrice: null },
  );

  /**
   * Live weighted-average preview using the ADR-0001 formula:
   *   newAvg = (oldQty * oldAvg + addQty * addPrice) / (oldQty + addQty)
   * with the zero-old-quantity edge case (sold-out re-opening → addPrice).
   * Returns null when inputs are incomplete so the template can hide it.
   */
  public readonly previewAveragePrice = computed<number | null>(() => {
    const { addQuantity, addBuyPrice } = this.formValue();
    const addQty = Number(addQuantity);
    const addPrice = Number(addBuyPrice);
    if (!Number.isFinite(addQty) || addQty <= 0) return null;
    if (!Number.isFinite(addPrice) || addPrice <= 0) return null;
    const oldQty = this.currentQuantity;
    const oldAvg = this.currentAveragePrice;
    const newQty = oldQty + addQty;
    if (newQty <= 0) return null;
    if (oldQty <= 0) return addPrice;
    return (oldQty * oldAvg + addQty * addPrice) / newQty;
  });

  public readonly previewQuantity = computed<number | null>(() => {
    const { addQuantity } = this.formValue();
    const addQty = Number(addQuantity);
    if (!Number.isFinite(addQty) || addQty <= 0) return null;
    return this.currentQuantity + addQty;
  });

  public readonly canSubmit = computed<boolean>(
    () => this.previewAveragePrice() !== null,
  );

  ngOnInit(): void {
    this.form = this.fb.group({
      addQuantity: [null, [Validators.required, positiveNumber]],
      addBuyPrice: [null, [Validators.required, positiveNumber]],
    });

    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((v) =>
        this.formValue.set({
          addQuantity: v.addQuantity,
          addBuyPrice: v.addBuyPrice,
        }),
      );
  }

  public onApply(): void {
    if (!this.canSubmit() || !this.form.valid) return;
    const { addQuantity, addBuyPrice } = this.form.value as {
      addQuantity: number;
      addBuyPrice: number;
    };
    this.submitted.emit({
      addQuantity: Number(addQuantity),
      addBuyPrice: Number(addBuyPrice),
    });
    this.form.reset();
  }
}

function positiveNumber(control: { value: unknown }) {
  const n = Number(control.value);
  return Number.isFinite(n) && n > 0 ? null : { positive: true };
}
