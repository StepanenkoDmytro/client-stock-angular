import { Injectable, inject } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Observable, filter } from 'rxjs';
import { ITag } from '../../../domain/tag.domain';
import { createSystemTags } from '../model/system-tags.constants';
import {
  addTag,
  deleteTag,
  editTag,
  loadTags,
} from '../store/tags.actions';
import { ITagsState } from '../store/tags.reducer';
import {
  selectTagsList,
  selectTagsState,
} from '../store/tags.selectors';

/**
 * TagsService — feature-local service for tag CRUD + localStorage sync.
 *
 * Mirrors the SavingsService pattern (`service/savings.service.ts`):
 * NgRx is the source of truth, localStorage is just the offline snapshot.
 * No REST sync yet — that's M5 (`HoldingsEffects` + `TagsEffects` per
 * `docs/notes/2026-05-forms-plan.md` out-of-scope list).
 *
 * Bootstrap:
 *  - First launch (no `'tags-list'` in localStorage): seed 12 system tags
 *    via `createSystemTags()` (`pages/savings/model/system-tags.constants.ts`).
 *  - Subsequent launches: load the snapshot as-is.
 */
@Injectable({ providedIn: 'root' })
export class TagsService {
  private static readonly STORAGE_KEY = 'tags-list';

  private readonly store$ = inject(Store<{ tags: ITagsState }>);

  private isInit = false;

  init(): void {
    if (this.isInit) {
      return;
    }
    this.isInit = true;
    this.bootstrap();

    this.store$
      .pipe(
        select(selectTagsState),
        filter((state) => !!state),
      )
      .subscribe((state) => {
        localStorage.setItem(TagsService.STORAGE_KEY, JSON.stringify(state));
      });

    window.addEventListener('storage', () => this.bootstrap(true));
  }

  getAll(): Observable<ITag[]> {
    return this.store$.pipe(select(selectTagsList));
  }

  addTag(tag: ITag): void {
    this.store$.dispatch(addTag({ tag }));
  }

  editTag(tag: ITag): void {
    this.store$.dispatch(editTag({ tag }));
  }

  deleteTag(id: string): void {
    this.store$.dispatch(deleteTag({ id }));
  }

  /**
   * Seeds the store from localStorage; on first launch (no snapshot) it
   * seeds the system tags instead.
   *
   * @param forceReload — when `true`, ignores the in-memory cache and
   *   re-dispatches loadTags from localStorage. Used by the cross-tab
   *   `'storage'` event listener.
   */
  private bootstrap(forceReload = false): void {
    const raw = localStorage.getItem(TagsService.STORAGE_KEY);
    if (raw) {
      try {
        const state = JSON.parse(raw) as ITagsState;
        this.store$.dispatch(loadTags({ state }));
        return;
      } catch {
        // Corrupted snapshot — fall through to system seed.
      }
    }

    if (!forceReload) {
      const seeded: ITagsState = { tagsList: createSystemTags() };
      this.store$.dispatch(loadTags({ state: seeded }));
    }
  }
}
