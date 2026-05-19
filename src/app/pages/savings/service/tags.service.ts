import { Injectable, inject } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Observable, filter, map, of, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
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
import {
  TagApiDto,
  TagCreateRequest,
  TagUpdateRequest,
  TagsApiService,
} from './tags-api.service';

/**
 * TagsService — REST-first tag CRUD with localStorage cache.
 *
 * <p>Mirrors {@code HoldingService} (Phase-0 refactor):
 * <ul>
 *   <li><b>Production</b> — backend is the source of truth. {@link #init}
 *       shows the localStorage cache for instant UX, then re-hydrates
 *       from `GET /api/v1/tags`. Writes go through REST and dispatch
 *       the server-shaped row into the store on success; on error the
 *       caller's subscribe handler shows a contextual snackbar.</li>
 *   <li><b>Demo mode</b> (`environment.demoData=true`) — short-circuits
 *       to a local store + 12 system tags seed so screenshot / story
 *       sessions stay self-contained.</li>
 * </ul>
 */
@Injectable({ providedIn: 'root' })
export class TagsService {
  private static readonly STORAGE_KEY = 'tags-list';

  private readonly store$ = inject(Store<{ tags: ITagsState }>);
  private readonly api = inject(TagsApiService);

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

  /**
   * REST-first create. POST `/api/v1/tags`, then dispatch the server-
   * canonical row into the store. Caller subscribes for snackbar +
   * navigate / error feedback. Demo mode dispatches locally.
   */
  addTag(tag: ITag): Observable<ITag> {
    if (environment.demoData) {
      this.store$.dispatch(addTag({ tag }));
      return of(tag);
    }
    const body: TagCreateRequest = {
      name: tag.name,
      parentId: tag.parentId,
      color: tag.color || undefined,
    };
    return this.api.create(body).pipe(
      map(TagsService.fromApiDto),
      tap((saved) => this.store$.dispatch(addTag({ tag: saved }))),
    );
  }

  /**
   * REST-first update. PUT `/api/v1/tags/{id}` then dispatch.
   * The id stays stable across the round-trip so the store edit
   * lands on the same row.
   */
  editTag(tag: ITag): Observable<ITag> {
    if (environment.demoData) {
      this.store$.dispatch(editTag({ tag }));
      return of(tag);
    }
    const body: TagUpdateRequest = {
      name: tag.name,
      parentId: tag.parentId,
      color: tag.color || undefined,
    };
    return this.api.update(tag.id, body).pipe(
      map(TagsService.fromApiDto),
      tap((saved) => this.store$.dispatch(editTag({ tag: saved }))),
    );
  }

  /**
   * REST-first delete. DELETE `/api/v1/tags/{id}` then drop from store.
   * Server returns 409 if the tag has children; per-call snackbar
   * surfaces that to the user.
   */
  deleteTag(id: string): Observable<void> {
    if (environment.demoData) {
      this.store$.dispatch(deleteTag({ id }));
      return of(void 0);
    }
    return this.api.delete(id).pipe(
      tap(() => this.store$.dispatch(deleteTag({ id }))),
    );
  }

  // ---- internal ----

  /**
   * Seeds the store: localStorage cache shown instantly, then re-
   * hydrated from `GET /api/v1/tags` in production. Demo mode seeds
   * the 12 system tags on first launch when no snapshot exists.
   */
  private bootstrap(forceReload = false): void {
    const raw = localStorage.getItem(TagsService.STORAGE_KEY);
    let usedCache = false;
    if (raw) {
      try {
        const state = JSON.parse(raw) as ITagsState;
        this.store$.dispatch(loadTags({ state }));
        usedCache = true;
        if (environment.demoData) return;
      } catch {
        // Corrupted snapshot — fall through.
      }
    }

    if (forceReload) {
      return;
    }

    if (!environment.demoData) {
      if (!usedCache) {
        this.store$.dispatch(loadTags({ state: { tagsList: [] } }));
      }
      this.hydrateFromBackend();
      return;
    }

    // Demo: seed system tags when localStorage was empty.
    const seeded: ITagsState = { tagsList: createSystemTags() };
    this.store$.dispatch(loadTags({ state: seeded }));
  }

  /**
   * Pulls canonical tag list from `GET /api/v1/tags` and replaces the
   * store. On network / 5xx errors leave the cached state in place;
   * {@code ApiErrorInterceptor} already surfaces the global snackbar.
   */
  private hydrateFromBackend(): void {
    this.api.list().subscribe({
      next: (dtos) => {
        const list = dtos.map(TagsService.fromApiDto);
        this.store$.dispatch(loadTags({ state: { tagsList: list } }));
      },
      error: () => {
        // keep cache; interceptor surfaced the toast
      },
    });
  }

  /**
   * Backend {@link TagApiDto} → frontend {@link ITag}. Color falls back
   * to a soft grey when the backend returns null (the UI assumes
   * non-null on {@code ITag.color}); icon is not yet persisted server-
   * side, so we drop it on read.
   */
  private static fromApiDto(d: TagApiDto): ITag {
    return {
      id: d.id,
      name: d.name,
      parentId: d.parentId ?? undefined,
      color: d.color ?? '#908E91',
      system: d.system,
      createdAt: d.createdAt,
    };
  }
}
