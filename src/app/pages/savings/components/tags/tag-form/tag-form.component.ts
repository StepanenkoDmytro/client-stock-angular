import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  MatSnackBar,
  MatSnackBarModule,
} from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, startWith } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { ITag } from '../../../../../domain/tag.domain';
import { ArrowBackComponent } from '../../../../../core/UI/components/arrow-back/arrow-back.component';
import { ColorPickerComponent } from '../../../../../core/UI/components/color-picker/color-picker.component';
import { FormFieldComponent } from '../../../../../core/UI/components/form-field/form-field.component';
import { FormInputComponent } from '../../../../../core/UI/components/form-input/form-input.component';
import { IconComponent } from '../../../../../core/UI/components/icon/icon.component';
import { IconsPickerComponent } from '../../../../../core/UI/components/icons-picker/icons-picker.component';
import { NotificationComponent } from '../../../../../core/UI/components/notification/notification.component';
import { PrevRouteComponent } from '../../../../../core/UI/components/prev-route/prev-route.component';
import { TagsService } from '../../../service/tags.service';
import { selectTagsList } from '../../../store/tags.selectors';
import { TagValidator } from '../../../validator/TagValidator';

const MATERIAL_MODULES = [
  ReactiveFormsModule,
  MatFormFieldModule,
  MatInputModule,
  MatSelectModule,
  MatButtonModule,
  MatIconModule,
  MatSnackBarModule,
];

const UI_COMPONENTS = [
  PrevRouteComponent,
  ArrowBackComponent,
  ColorPickerComponent,
  IconsPickerComponent,
  IconComponent,
  FormFieldComponent,
  FormInputComponent,
];

const DEFAULT_TAG_COLOR = '#908E91';

interface ParentOption {
  id: string | null;
  label: string;
  /**
   * Stable key for Angular's `@for ... track` expression. Angular 17's
   * @for compiler doesn't accept conditional/coalescing expressions in
   * `track`, so we pre-compute one. `'__root__'` for the null-parent
   * sentinel; tag id otherwise.
   */
  key: string;
}

interface TagFormValue {
  name: string;
  parentId: string | null;
  color: string;
  icon: string | null;
}

@Component({
  selector: 'pgz-tag-form',
  standalone: true,
  imports: [CommonModule, ...MATERIAL_MODULES, ...UI_COMPONENTS],
  templateUrl: './tag-form.component.html',
  styleUrl: './tag-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(Store);
  private readonly tagsService = inject(TagsService);
  private readonly snackBar = inject(MatSnackBar);

  // ---- Reactive Form ----

  public readonly nameCtrl = new FormControl<string>('', {
    nonNullable: true,
    validators: [TagValidator.nameValidator],
  });
  public readonly parentCtrl = new FormControl<string | null>(null);
  public readonly colorCtrl = new FormControl<string>(DEFAULT_TAG_COLOR, {
    nonNullable: true,
    validators: [Validators.required],
  });
  public readonly iconCtrl = new FormControl<string | null>(null);

  public readonly form = this.fb.group({
    name: this.nameCtrl,
    parentId: this.parentCtrl,
    color: this.colorCtrl,
    icon: this.iconCtrl,
  });

  // ---- Signals from store + route ----

  // Single subscription to the tags list signal — read directly in computeds below.
  private readonly allTagsSignal = this.store.selectSignal(selectTagsList);

  private readonly routeId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('id'))),
    { initialValue: null as string | null },
  );

  public readonly isEdit = computed(() => !!this.routeId());

  private readonly editingTag = computed<ITag | undefined>(() => {
    const id = this.routeId();
    if (!id) {
      return undefined;
    }
    return this.allTagsSignal().find((t) => t.id === id);
  });

  public readonly isSystem = computed(() => !!this.editingTag()?.system);

  /**
   * Parent dropdown options: «(root)» + every existing tag with breadcrumb
   * label («Investment / Long-term»). Excludes the current tag and its
   * descendants so the user can't create a cycle at the UI level (the
   * validator backs this up defensively).
   */
  public readonly parentOptions = computed<ParentOption[]>(() => {
    const tags = this.allTagsSignal();
    const editingId = this.routeId();
    const excluded = new Set<string>();
    if (editingId) {
      excluded.add(editingId);
      for (const d of collectDescendants(tags, editingId)) {
        excluded.add(d);
      }
    }

    const byId = new Map(tags.map((t) => [t.id, t]));
    const buildPath = (tag: ITag): string => {
      const parts: string[] = [];
      let cursor: ITag | undefined = tag;
      const visited = new Set<string>();
      while (cursor && !visited.has(cursor.id)) {
        visited.add(cursor.id);
        parts.unshift(cursor.name);
        cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
      }
      return parts.join(' / ');
    };

    const options: ParentOption[] = [
      { id: null, label: '(root)', key: '__root__' },
    ];
    for (const t of tags) {
      if (excluded.has(t.id)) {
        continue;
      }
      options.push({ id: t.id, label: buildPath(t), key: t.id });
    }
    options.sort((a, b) => {
      if (a.id === null) return -1;
      if (b.id === null) return 1;
      return a.label.localeCompare(b.label);
    });
    return options;
  });

  public readonly ancestorsLabel = computed(() => {
    const tag = this.editingTag();
    if (!tag) {
      return '';
    }
    const tags = this.allTagsSignal();
    const byId = new Map(tags.map((t) => [t.id, t]));
    const parts: string[] = [];
    let cursor: ITag | undefined = tag;
    const visited = new Set<string>();
    while (cursor && !visited.has(cursor.id)) {
      visited.add(cursor.id);
      parts.unshift(cursor.name);
      cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
    }
    return parts.join(' / ');
  });

  // ---- View-state signals ----

  public readonly isColorPickerOpen = signal(false);
  public readonly isIconPickerOpen = signal(false);

  /**
   * True while a REST round-trip is in flight. Disables Save so the user
   * can't double-submit; the template can render a spinner off this.
   */
  public readonly saving = signal(false);

  // form.status as a signal that fires on every value/status change.
  private readonly formStatus = toSignal(
    this.form.statusChanges.pipe(startWith(this.form.status)),
    { initialValue: this.form.status },
  );

  // Track parentId value too so occupiedColors recomputes when parent changes.
  private readonly parentIdSignal = toSignal(
    this.parentCtrl.valueChanges.pipe(startWith(this.parentCtrl.value)),
    { initialValue: this.parentCtrl.value },
  );

  public readonly canSave = computed(
    () => this.formStatus() === 'VALID' && !this.isSystem(),
  );

  /**
   * Occupied colors of sibling tags (same parent as current form value).
   * The ColorPicker uses these to gray-out swatches that are already taken.
   */
  public readonly occupiedColors = computed<string[]>(() => {
    const tags = this.allTagsSignal();
    const editingId = this.routeId();
    const currentParent = this.parentIdSignal() ?? null;
    return tags
      .filter(
        (t) => t.id !== editingId && (t.parentId ?? null) === currentParent,
      )
      .map((t) => t.color.toUpperCase());
  });

  // ---- Effects: prefill form on edit; (re)wire validators when tags load ----

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private readonly fillOnEdit = effect(() => {
    const editing = this.editingTag();
    if (!editing) {
      return;
    }
    this.form.patchValue(
      {
        name: editing.name,
        parentId: editing.parentId ?? null,
        color: editing.color,
        icon: editing.icon ?? null,
      },
      { emitEvent: false },
    );

    if (editing.system) {
      this.form.disable({ emitEvent: false });
    }
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private readonly rewireValidators = effect(
    () => {
      const tags = this.allTagsSignal();
      const editingId = this.routeId() ?? undefined;

      this.form.setValidators(
        TagValidator.uniqueNameValidator(tags, editingId),
      );
      this.parentCtrl.setValidators(
        editingId
          ? TagValidator.parentCycleValidator(tags, editingId)
          : null,
      );
      // emitEvent: true is required so `formStatus` (toSignal on
      // form.statusChanges) refreshes after we re-attach validators —
      // otherwise canSave stays stale on the edit-flow until the user
      // touches a field. The write into the toSignal-backed signal happens
      // synchronously during statusChanges emission inside this effect,
      // which is exactly what `allowSignalWrites: true` is designed for.
      this.form.updateValueAndValidity({ emitEvent: true });
      this.parentCtrl.updateValueAndValidity({ emitEvent: true });
    },
    { allowSignalWrites: true },
  );

  constructor() {
    this.tagsService.init();
  }

  // ---- Picker UI handlers ----

  public toggleColorPicker(): void {
    if (this.isSystem()) {
      return;
    }
    this.isColorPickerOpen.update((v) => !v);
    // If opening color picker, close the other.
    if (this.isColorPickerOpen()) {
      this.isIconPickerOpen.set(false);
    }
  }

  public toggleIconPicker(): void {
    if (this.isSystem()) {
      return;
    }
    this.isIconPickerOpen.update((v) => !v);
    if (this.isIconPickerOpen()) {
      this.isColorPickerOpen.set(false);
    }
  }

  public onColorSelected(color: string): void {
    this.colorCtrl.setValue(color);
    this.isColorPickerOpen.set(false);
  }

  public onIconSelected(icon: string): void {
    this.iconCtrl.setValue(icon);
    this.isIconPickerOpen.set(false);
  }

  public onClearIcon(): void {
    this.iconCtrl.setValue(null);
  }

  // ---- Save / back ----

  public onSave(): void {
    if (!this.form.valid || this.isSystem() || this.saving()) {
      return;
    }
    const value = this.form.getRawValue() as TagFormValue;
    const now = new Date().toISOString();

    const editing = this.editingTag();
    this.saving.set(true);
    if (editing) {
      const updated: ITag = {
        ...editing,
        name: value.name.trim(),
        parentId: value.parentId ?? undefined,
        color: value.color,
        icon: value.icon ?? undefined,
      };
      this.tagsService.editTag(updated).subscribe({
        next: (saved) => {
          this.saving.set(false);
          this.showSnackbar(`Tag «${saved.name}» updated`);
          this.router.navigate(['/savings/tags']);
        },
        error: (err) => {
          this.saving.set(false);
          this.showSnackbar(`Could not save: ${describeTagError(err)}`);
        },
      });
    } else {
      const created: ITag = {
        id: uuid(),
        name: value.name.trim(),
        parentId: value.parentId ?? undefined,
        color: value.color,
        icon: value.icon ?? undefined,
        system: false,
        createdAt: now,
      };
      this.tagsService.addTag(created).subscribe({
        next: (saved) => {
          this.saving.set(false);
          this.showSnackbar(`Tag «${saved.name}» added`);
          this.router.navigate(['/savings/tags']);
        },
        error: (err) => {
          this.saving.set(false);
          this.showSnackbar(`Could not add: ${describeTagError(err)}`);
        },
      });
    }
  }

  public goBack(): void {
    this.router.navigate(['/savings/tags']);
  }

  private showSnackbar(message: string): void {
    this.snackBar.openFromComponent(NotificationComponent, {
      duration: 2000,
      data: { message },
      panelClass: 'custom-snackbar',
    });
  }
}

function collectDescendants(tags: ITag[], rootId: string): string[] {
  const result: string[] = [];
  const queue: string[] = [rootId];
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    for (const t of tags) {
      if (t.parentId === currentId) {
        result.push(t.id);
        queue.push(t.id);
      }
    }
  }
  return result;
}

/**
 * Extract a short, human-friendly snackbar message from a tag CRUD
 * HTTP error. Server validation comes back as 4xx with `{message}`;
 * network / 5xx fall back to a generic copy.
 */
function describeTagError(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as { status?: number; error?: { message?: string } };
    if (e.status === 0) return 'no network';
    if (e.status === 409) return 'a tag with this name already exists';
    if (e.status && e.status >= 500) return 'server error';
    if (e.error && e.error.message) return e.error.message;
  }
  return 'unexpected error';
}
