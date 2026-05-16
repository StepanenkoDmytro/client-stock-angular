import {
  AbstractControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { ITag } from '../../../domain/tag.domain';

/**
 * Validators for the tag-form.
 *
 * Three flavors:
 *  - `nameValidator` — sync field validator (required, length, no whitespace).
 *  - `uniqueNameValidator(allTags, currentId?)` — group-level validator that
 *    needs to read both `name` and `parentId` from the form simultaneously.
 *    Attached to the FormGroup, not a single FormControl.
 *  - `parentCycleValidator(allTags, currentId)` — field validator on
 *    `parentId`. Detects self-loops and indirect cycles by walking up the
 *    ancestor chain.
 *
 * Backend equivalence: the uniqueness constraint mirrors the SQL unique
 * `(user_id, name, parent_id)` per ADR-0007 §74; cycle detection mirrors the
 * recursive walk that the backend will do at insert-time.
 */

export class TagValidator {
  static readonly MIN_NAME_LENGTH = 1;
  static readonly MAX_NAME_LENGTH = 30;

  static nameValidator(control: AbstractControl): ValidationErrors | null {
    const raw = control.value;
    if (typeof raw !== 'string') {
      return { required: true };
    }
    const trimmed = raw.trim();
    if (trimmed.length < TagValidator.MIN_NAME_LENGTH) {
      return { required: true };
    }
    if (trimmed.length > TagValidator.MAX_NAME_LENGTH) {
      return { maxLength: { actual: trimmed.length, max: TagValidator.MAX_NAME_LENGTH } };
    }
    return null;
  }

  /**
   * Group-level validator. Attach to the FormGroup:
   *
   *   this.form = this.fb.group(
   *     { name: [...], parentId: [...] },
   *     { validators: TagValidator.uniqueNameValidator(allTags, currentId) },
   *   );
   *
   * Returns `{ duplicateName: true }` on the group if another tag with the
   * same `(name, parentId)` already exists. Trim + case-insensitive match.
   */
  static uniqueNameValidator(allTags: ITag[], currentId?: string): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      if (!(group instanceof FormGroup)) {
        return null;
      }
      const nameRaw = group.get('name')?.value;
      const parentId = (group.get('parentId')?.value as string | null | undefined) ?? null;

      if (typeof nameRaw !== 'string') {
        return null;
      }
      const trimmedName = nameRaw.trim().toLowerCase();
      if (!trimmedName) {
        return null;
      }

      const conflict = allTags.some(
        (t) =>
          t.id !== currentId &&
          (t.parentId ?? null) === parentId &&
          t.name.trim().toLowerCase() === trimmedName,
      );

      return conflict ? { duplicateName: true } : null;
    };
  }

  /**
   * Field validator factory for `parentId`.
   *
   * - For ADD (no `currentId`): never errors — any existing tag is a valid
   *   parent.
   * - For EDIT: errors when chosen `parentId` is the tag itself or a
   *   descendant. Walk up from the candidate parent following `parent_id`
   *   until we hit the root (`null`) or the current tag (cycle).
   */
  static parentCycleValidator(allTags: ITag[], currentId?: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!currentId) {
        return null;
      }
      const candidate = (control.value as string | null | undefined) ?? null;
      if (!candidate) {
        return null;
      }
      if (candidate === currentId) {
        return { parentCycle: true };
      }

      const byId = new Map(allTags.map((t) => [t.id, t]));
      let cursor: string | null | undefined = candidate;
      const visited = new Set<string>();
      while (cursor) {
        if (cursor === currentId) {
          return { parentCycle: true };
        }
        if (visited.has(cursor)) {
          // Corrupt data — break out, treat as cycle.
          return { parentCycle: true };
        }
        visited.add(cursor);
        cursor = byId.get(cursor)?.parentId ?? null;
      }
      return null;
    };
  }
}
