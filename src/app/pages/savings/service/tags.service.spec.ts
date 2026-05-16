import { TestBed } from '@angular/core/testing';
import { Action, Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { ITag } from '../../../domain/tag.domain';
import {
  addTag,
  deleteTag,
  editTag,
  loadTags,
} from '../store/tags.actions';
import { ITagsState } from '../store/tags.reducer';
import { TagsService } from './tags.service';

/**
 * Lightweight Store stub: captures dispatched actions and emits whatever the
 * test pushes into `state$`. We avoid pulling in MockStore from
 * `@ngrx/store/testing` to keep this spec dependency-free.
 */
class StubStore {
  public readonly dispatched: Action[] = [];
  private readonly state$ = new Subject<unknown>();

  dispatch(action: Action): void {
    this.dispatched.push(action);
  }

  select(selector: any): any {
    return this.state$.asObservable().pipe();
  }

  pipe(...args: any[]): any {
    const subj = this.state$.asObservable();
    return subj;
  }

  pushState(state: { tags: ITagsState }): void {
    this.state$.next(state);
  }
}

function makeTag(id: string, name: string, opts: Partial<ITag> = {}): ITag {
  return {
    id,
    name,
    parentId: undefined,
    color: '#888',
    system: false,
    createdAt: '2026-05-15T00:00:00.000Z',
    ...opts,
  };
}

describe('TagsService', () => {
  let stub: StubStore;
  let service: TagsService;
  const STORAGE_KEY = 'tags-list';

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    stub = new StubStore();
    TestBed.configureTestingModule({
      providers: [
        TagsService,
        { provide: Store, useValue: stub },
      ],
    });
    service = TestBed.inject(TagsService);
  });

  afterEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  it('seeds 12 system tags on first init (no localStorage)', () => {
    service.init();
    const load = stub.dispatched.find((a) => a.type === loadTags.type) as
      | ReturnType<typeof loadTags>
      | undefined;
    expect(load).toBeDefined();
    expect(load!.payload.state.tagsList.length).toBe(12);
    expect(load!.payload.state.tagsList.every((t) => t.system)).toBe(true);
  });

  it('does not seed when localStorage already has tags', () => {
    const snapshot: ITagsState = {
      tagsList: [makeTag('u1', 'Custom', { system: false })],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));

    service.init();

    const load = stub.dispatched.find((a) => a.type === loadTags.type) as
      | ReturnType<typeof loadTags>
      | undefined;
    expect(load).toBeDefined();
    expect(load!.payload.state.tagsList.length).toBe(1);
    expect(load!.payload.state.tagsList[0].id).toBe('u1');
  });

  it('falls back to system seed when localStorage is corrupted', () => {
    localStorage.setItem(STORAGE_KEY, 'not-json');
    service.init();
    const load = stub.dispatched.find((a) => a.type === loadTags.type) as
      | ReturnType<typeof loadTags>
      | undefined;
    expect(load).toBeDefined();
    expect(load!.payload.state.tagsList.length).toBe(12);
  });

  it('init is idempotent', () => {
    service.init();
    const firstCount = stub.dispatched.length;
    service.init();
    expect(stub.dispatched.length).toBe(firstCount);
  });

  it('addTag dispatches addTag action', () => {
    service.addTag(makeTag('x', 'X'));
    const dispatched = stub.dispatched.find((a) => a.type === addTag.type);
    expect(dispatched).toBeDefined();
  });

  it('editTag dispatches editTag action', () => {
    service.editTag(makeTag('x', 'X-edit'));
    const dispatched = stub.dispatched.find((a) => a.type === editTag.type);
    expect(dispatched).toBeDefined();
  });

  it('deleteTag dispatches deleteTag action', () => {
    service.deleteTag('x');
    const dispatched = stub.dispatched.find((a) => a.type === deleteTag.type);
    expect(dispatched).toBeDefined();
  });
});
