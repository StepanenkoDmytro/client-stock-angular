import { ITag } from '../../../domain/tag.domain';
import { ITagsState } from './tags.reducer';
import {
  selectRootTags,
  selectSystemTags,
  selectTagAncestors,
  selectTagById,
  selectTagSubtree,
  selectTagTree,
  selectTagsByParent,
  selectTagsList,
  selectUserTags,
} from './tags.selectors';

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

function withState(tagsList: ITag[]): { tags: ITagsState } {
  return { tags: { tagsList } };
}

describe('tags.selectors', () => {
  describe('selectTagsList', () => {
    it('returns the list', () => {
      const tags = [makeTag('a', 'A'), makeTag('b', 'B')];
      expect(selectTagsList(withState(tags))).toEqual(tags);
    });

    it('returns empty array when state missing', () => {
      expect(selectTagsList({ tags: undefined as any })).toEqual([]);
    });
  });

  describe('selectSystemTags / selectUserTags', () => {
    const tags = [
      makeTag('s1', 'Investment', { system: true }),
      makeTag('u1', 'Custom', { system: false }),
    ];
    it('partitions correctly', () => {
      expect(selectSystemTags(withState(tags)).map((t) => t.id)).toEqual(['s1']);
      expect(selectUserTags(withState(tags)).map((t) => t.id)).toEqual(['u1']);
    });
  });

  describe('selectTagById', () => {
    const tags = [makeTag('a', 'A'), makeTag('b', 'B')];
    it('finds existing', () => {
      expect(selectTagById('a')(withState(tags))?.name).toBe('A');
    });
    it('returns undefined for missing', () => {
      expect(selectTagById('x')(withState(tags))).toBeUndefined();
    });
    it('returns undefined for null id', () => {
      expect(selectTagById(null)(withState(tags))).toBeUndefined();
    });
  });

  describe('selectTagsByParent (sort: system first, then alphabetical)', () => {
    const tags = [
      makeTag('c', 'Charlie'),
      makeTag('a', 'Alpha'),
      makeTag('b', 'Beta', { system: true }),
    ];
    it('roots sorted with system first', () => {
      const result = selectTagsByParent(null)(withState(tags));
      expect(result.map((t) => t.id)).toEqual(['b', 'a', 'c']);
    });
    it('returns children of a parent', () => {
      const tree = [
        makeTag('root', 'Root'),
        makeTag('c1', 'Child A', { parentId: 'root' }),
        makeTag('c2', 'Child B', { parentId: 'root' }),
        makeTag('other', 'Other'),
      ];
      const result = selectTagsByParent('root')(withState(tree));
      expect(result.map((t) => t.id)).toEqual(['c1', 'c2']);
    });
  });

  describe('selectRootTags', () => {
    it('returns only tags with no parent', () => {
      const tags = [
        makeTag('r1', 'R1'),
        makeTag('c1', 'C1', { parentId: 'r1' }),
        makeTag('r2', 'R2'),
      ];
      const result = selectRootTags(withState(tags));
      expect(result.map((t) => t.id).sort()).toEqual(['r1', 'r2']);
    });
  });

  describe('selectTagSubtree', () => {
    it('collects root + all descendants', () => {
      const tags = [
        makeTag('inv', 'Investment'),
        makeTag('lt', 'Long-term', { parentId: 'inv' }),
        makeTag('lt-x', 'LT.X', { parentId: 'lt' }),
        makeTag('st', 'Short-term', { parentId: 'inv' }),
        makeTag('other', 'Other'),
      ];
      const subtree = selectTagSubtree('inv')(withState(tags));
      expect(subtree.map((t) => t.id).sort()).toEqual([
        'inv',
        'lt',
        'lt-x',
        'st',
      ]);
    });

    it('returns empty array if root missing', () => {
      expect(selectTagSubtree('missing')(withState([]))).toEqual([]);
    });
  });

  describe('selectTagTree', () => {
    it('builds nested ITagTree[]', () => {
      const tags = [
        makeTag('inv', 'Investment'),
        makeTag('lt', 'Long-term', { parentId: 'inv' }),
        makeTag('st', 'Short-term', { parentId: 'inv' }),
        makeTag('other', 'Other'),
      ];
      const tree = selectTagTree(withState(tags));
      expect(tree.length).toBe(2);
      const inv = tree.find((t) => t.id === 'inv')!;
      expect(inv.children.map((c) => c.id).sort()).toEqual(['lt', 'st']);
      expect(inv.children.every((c) => c.children.length === 0)).toBe(true);
    });
  });

  describe('selectTagAncestors', () => {
    it('returns chain from root to self', () => {
      const tags = [
        makeTag('a', 'A'),
        makeTag('b', 'B', { parentId: 'a' }),
        makeTag('c', 'C', { parentId: 'b' }),
      ];
      const chain = selectTagAncestors('c')(withState(tags));
      expect(chain.map((t) => t.id)).toEqual(['a', 'b', 'c']);
    });

    it('returns empty for missing tag', () => {
      expect(selectTagAncestors('x')(withState([]))).toEqual([]);
    });
  });
});
