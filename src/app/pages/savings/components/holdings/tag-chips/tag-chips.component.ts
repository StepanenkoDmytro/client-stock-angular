import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { ITag } from '../../../../../domain/tag.domain';
import { selectTagsList } from '../../../store/tags.selectors';

/**
 * Multi-select chip input for assigning Tags to a Holding.
 *
 * Stateless from the caller's perspective: parent forms hold the
 * canonical `tagIds: string[]` in their FormGroup; this component is
 * a thin presentation + autocomplete UI over the Tags store. We don't
 * expose ControlValueAccessor yet (PR4 §10 risk #1 flagged that as
 * non-trivial) — instead we keep it a regular `@Input/@Output` pair,
 * which integrates cleanly with `patchValue` on the parent form.
 *
 * Behaviour:
 *  - Existing tag chips render in selection order (most recently added
 *    last).
 *  - Typing in the autocomplete field narrows by case-insensitive
 *    substring match across `name`.
 *  - Picking a suggestion appends its id and clears the search box.
 *  - Clicking the chip's × removes it from the selection.
 *  - When no match is found, an "+ Create new tag" CTA navigates to
 *    `/savings/tags/add` (re-using the existing tag-form). The user
 *    returns to the holding form via back-arrow with the new tag
 *    available in the store and can pick it manually. Inline modal
 *    creation is out of scope for this PR — see follow-up note in
 *    `2026-05-pr4-crud-holdings-task.md` §10.
 */
@Component({
  selector: 'pgz-tag-chips',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  templateUrl: './tag-chips.component.html',
  styleUrl: './tag-chips.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagChipsComponent {
  private readonly store = inject(Store);
  private readonly router = inject(Router);

  // ---- Inputs / outputs ----

  @Input()
  public set value(ids: ReadonlyArray<string>) {
    this._value.set(Array.from(ids ?? []));
  }
  public get value(): ReadonlyArray<string> {
    return this._value();
  }
  private readonly _value = signal<string[]>([]);

  @Output() public readonly valueChange = new EventEmitter<string[]>();

  // ---- State ----

  private readonly allTags = this.store.selectSignal(selectTagsList);

  public readonly searchCtrl = new FormControl<string>('', {
    nonNullable: true,
  });

  /** Live search string, mirrored from the FormControl so we can derive
   *  filtered suggestions reactively without RxJS plumbing. */
  private readonly query = signal<string>('');

  constructor() {
    this.searchCtrl.valueChanges.subscribe((v) => this.query.set(v ?? ''));
  }

  // ---- Derived ----

  /** Tags currently attached to the holding — in selection order. */
  public readonly selectedTags = computed<ITag[]>(() => {
    const byId = new Map(this.allTags().map((t) => [t.id, t]));
    return this._value()
      .map((id) => byId.get(id))
      .filter((t): t is ITag => !!t);
  });

  /** Suggestions for the autocomplete dropdown — excludes already-picked
   *  tags and applies the case-insensitive substring filter. Capped at
   *  20 to keep the popup pleasant on small viewports. */
  public readonly suggestions = computed<ITag[]>(() => {
    const picked = new Set(this._value());
    const q = this.query().trim().toLowerCase();
    const all = this.allTags().filter((t) => !picked.has(t.id));
    const filtered = q
      ? all.filter((t) => t.name.toLowerCase().includes(q))
      : all;
    return filtered.slice(0, 20);
  });

  /** Show the "+ Create new tag" footer only when the typed query yields
   *  zero matches and is non-empty (otherwise the user clearly just
   *  hasn't typed anything yet). */
  public readonly showCreateCta = computed<boolean>(() => {
    return this.query().trim().length > 0 && this.suggestions().length === 0;
  });

  // ---- Actions ----

  public onSelect(event: MatAutocompleteSelectedEvent): void {
    const id = event.option.value as string;
    if (!id) {
      return;
    }
    if (this._value().includes(id)) {
      return;
    }
    const next = [...this._value(), id];
    this._value.set(next);
    this.valueChange.emit(next);
    this.searchCtrl.setValue('', { emitEvent: true });
  }

  public onRemove(tagId: string): void {
    const next = this._value().filter((id) => id !== tagId);
    this._value.set(next);
    this.valueChange.emit(next);
  }

  public onCreateNew(): void {
    // Lose the typed query — the tag-form page doesn't accept a prefill
    // arg yet; user re-enters the name on the next screen. Cheap to fix
    // later via a queryParam if we want.
    this.router.navigate(['/savings/tags/add']);
  }
}
