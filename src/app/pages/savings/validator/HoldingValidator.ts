import {
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { AssetClass } from '../../../domain/asset-class.domain';

/**
 * Validators for the Add/Edit Holding form per
 * `docs/notes/2026-05-pr4-crud-holdings-task.md` §4 «HoldingValidator».
 *
 * Per-class quantity rules differ because the user's mental model differs:
 * crypto positions naturally fall in fractions to 8 decimals; bank cash
 * is rarely entered with more than 2 decimals; real estate is whole units.
 * Bond / ETF / mutual-fund are not present in our current AssetClass
 * enum but the table here is forward-compatible — when ADR-0001 update
 * lands the new classes, decimalsForClass() returns sensible defaults
 * without a code change in callers.
 */
export class HoldingValidator {
  /**
   * Per-AssetClass max number of decimal digits allowed in `quantity`.
   * 0 means "integer only" (whole shares / whole real-estate units).
   */
  static decimalsForClass(assetClass: AssetClass): number {
    switch (assetClass) {
      case AssetClass.STOCK:
      case AssetClass.ETF:
      case AssetClass.TOKENIZED_STOCK:
        // Default is "whole shares" (most brokers historically). Fractional
        // shares come from a few brokers (IBKR, Robinhood) — accept 4
        // decimals tolerantly. Stricter validation per broker is a later
        // concern.
        return 4;
      case AssetClass.CRYPTO:
        return 8;
      case AssetClass.CASH:
      case AssetClass.DEPOSIT:
        return 2;
      case AssetClass.REAL_ESTATE:
        return 0;
      case AssetClass.OTHER:
        return 4;
    }
  }

  /**
   * Factory: returns a ValidatorFn parameterised by AssetClass so the form
   * can re-attach the validator when the user switches class mid-flow.
   *
   * Errors emitted:
   *   { required: true }                    — empty / null / undefined / ''
   *   { positive: true }                    — value ≤ 0
   *   { decimals: { max, actual } }         — too many fractional digits
   *   { invalid: true }                     — non-numeric value
   */
  static quantity(assetClass: AssetClass): ValidatorFn {
    return (ctrl: AbstractControl): ValidationErrors | null => {
      const raw = ctrl.value;
      if (raw === null || raw === undefined || raw === '') {
        return { required: true };
      }
      const num = typeof raw === 'number' ? raw : Number(raw);
      if (!Number.isFinite(num)) {
        return { invalid: true };
      }
      if (num <= 0) {
        return { positive: true };
      }
      const maxDecimals = HoldingValidator.decimalsForClass(assetClass);
      const text = String(raw);
      const dotIdx = text.indexOf('.');
      const decimals = dotIdx >= 0 ? text.length - dotIdx - 1 : 0;
      if (decimals > maxDecimals) {
        return { decimals: { max: maxDecimals, actual: decimals } };
      }
      return null;
    };
  }

  /** Same shape as `quantity` but without per-class branching. Used for
   *  per-share buy price + total cost where decimals up to 4 are always
   *  fine (USD cents, satoshis-per-unit, etc). */
  static buyPrice(ctrl: AbstractControl): ValidationErrors | null {
    const raw = ctrl.value;
    if (raw === null || raw === undefined || raw === '') {
      return { required: true };
    }
    const num = typeof raw === 'number' ? raw : Number(raw);
    if (!Number.isFinite(num)) {
      return { invalid: true };
    }
    if (num <= 0) {
      return { positive: true };
    }
    return null;
  }

  /** Field validator for the instrument selector — fails when no
   *  instrument is picked / created. */
  static instrumentRequired(ctrl: AbstractControl): ValidationErrors | null {
    return ctrl.value ? null : { required: true };
  }

  /** Field validator for trimmed, non-empty text (symbol, name, account
   *  name). Returns `{ required: true }` for null / undefined / ''. */
  static nonEmpty(ctrl: AbstractControl): ValidationErrors | null {
    const raw = ctrl.value;
    if (typeof raw !== 'string') {
      return { required: true };
    }
    return raw.trim().length > 0 ? null : { required: true };
  }
}
