import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validators for the Add-loop (Strategy · Looping) form
 * (`docs/notes/2026-05-add-loop-instrument-task.md` §2.3). Pure static
 * methods returning `ValidationErrors | null`, per the repo convention
 * (mirrors `HoldingValidator` / `TagValidator`).
 */
export class LoopValidator {
  /**
   * Group-level: a loop must have positive equity — `totalCollateral` must
   * exceed `totalDebt` (otherwise leverage / health are meaningless and the
   * net-worth contribution is ≤ 0). Returns `{ equityNotPositive: true }` on
   * the group when violated.
   */
  static equityPositive(group: AbstractControl): ValidationErrors | null {
    const collateral = Number(group.get('totalCollateral')?.value);
    const debt = Number(group.get('totalDebt')?.value);
    // Don't flag until both have values — per-field `required` covers empties.
    if (!Number.isFinite(collateral) || !Number.isFinite(debt)) return null;
    return collateral > debt ? null : { equityNotPositive: true };
  }

  /**
   * Liquidation threshold must be a percent in (0, 100]. 0 / blank / >100
   * makes health factor and buffer nonsensical, so this field can never be
   * left empty (the form's smart preset guarantees a value).
   */
  static liqThreshold(control: AbstractControl): ValidationErrors | null {
    const v = Number(control.value);
    if (control.value == null || control.value === '' || !Number.isFinite(v)) {
      return { required: true };
    }
    return v > 0 && v <= 100 ? null : { liqThresholdRange: true };
  }

  /** Date must not be in the future (accrued profit counts from the open date). */
  static notFutureDate(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const opened = new Date(control.value).getTime();
    if (!Number.isFinite(opened)) return null;
    // Compare against end-of-today so "today" is always valid.
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    return opened <= endOfToday.getTime() ? null : { futureDate: true };
  }

  /** Percent ∈ [0, max] (e.g. liquidation penalty 0..100). */
  static percentMax(max: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value == null || control.value === '') return null;
      const v = Number(control.value);
      if (!Number.isFinite(v)) return { percentRange: true };
      return v >= 0 && v <= max ? null : { percentRange: true };
    };
  }
}
