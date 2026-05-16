import { ITag } from '../../../domain/tag.domain';
import { logout } from '../../../store/user.actions';
import {
  addTag,
  deleteTag,
  editTag,
  loadTags,
} from './tags.actions';
import { ITagsState, tagsReducer } from './tags.reducer';

function makeTag(
  id: string,
  name: string,
  opts: Partial<ITag> = {},
): ITag {
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

describe('tagsReducer', () => {
  const initial: ITagsState = { tagsList: [] };

  it('loadTags replaces the state wholesale', () => {
    const next = tagsReducer(initial, loadTags({
      state: { tagsList: [makeTag('t1', 'A')] },
    }));
    expect(next.tagsList.length).toBe(1);
    expect(next.tagsList[0].id).toBe('t1');
  });

  it('addTag appends the tag', () => {
    const start: ITagsState = { tagsList: [makeTag('t1', 'A')] };
    const next = tagsReducer(start, addTag({ tag: makeTag('t2', 'B') }));
    expect(next.tagsList.length).toBe(2);
    expect(next.tagsList[1].id).toBe('t2');
  });

  it('editTag replaces a user tag by id', () => {
    const start: ITagsState = {
      tagsList: [makeTag('t1', 'A'), makeTag('t2', 'B')],
    };
    const updated = makeTag('t1', 'A-renamed', { color: '#111' });
    const next = tagsReducer(start, editTag({ tag: updated }));
    expect(next.tagsList.find((t) => t.id === 't1')!.name).toBe('A-renamed');
    expect(next.tagsList.find((t) => t.id === 't1')!.color).toBe('#111');
    expect(next.tagsList.find((t) => t.id === 't2')!.name).toBe('B');
  });

  it('editTag is a no-op for system tags', () => {
    const start: ITagsState = {
      tagsList: [makeTag('s1', 'Investment', { system: true })],
    };
    const attempt = makeTag('s1', 'Hacked', { system: true });
    const next = tagsReducer(start, editTag({ tag: attempt }));
    expect(next).toBe(start);
    expect(next.tagsList[0].name).toBe('Investment');
  });

  it('deleteTag removes the user tag by id', () => {
    const start: ITagsState = {
      tagsList: [makeTag('t1', 'A'), makeTag('t2', 'B')],
    };
    const next = tagsReducer(start, deleteTag({ id: 't1' }));
    expect(next.tagsList.length).toBe(1);
    expect(next.tagsList[0].id).toBe('t2');
  });

  it('deleteTag is a no-op for system tags', () => {
    const start: ITagsState = {
      tagsList: [makeTag('s1', 'Investment', { system: true })],
    };
    const next = tagsReducer(start, deleteTag({ id: 's1' }));
    expect(next).toBe(start);
    expect(next.tagsList.length).toBe(1);
  });

  it('logout resets to initial state', () => {
    const start: ITagsState = {
      tagsList: [makeTag('t1', 'A')],
    };
    const next = tagsReducer(start, logout());
    expect(next.tagsList).toEqual([]);
  });
});
