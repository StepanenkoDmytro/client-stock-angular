import {
  SYSTEM_TAG_NAMES,
  createSystemTags,
} from './system-tags.constants';

describe('createSystemTags', () => {
  it('produces 12 system tags (3 roots + 9 children) per ADR-0007', () => {
    const tags = createSystemTags();
    expect(tags.length).toBe(12);
    expect(tags.every((t) => t.system)).toBe(true);
  });

  it('all tags have unique UUIDs', () => {
    const tags = createSystemTags();
    const ids = new Set(tags.map((t) => t.id));
    expect(ids.size).toBe(tags.length);
  });

  it('produces fresh UUIDs on each invocation', () => {
    const a = createSystemTags();
    const b = createSystemTags();
    const idsA = new Set(a.map((t) => t.id));
    const intersect = b.filter((t) => idsA.has(t.id));
    expect(intersect).toEqual([]);
  });

  it('has 3 roots (no parentId)', () => {
    const tags = createSystemTags();
    const roots = tags.filter((t) => !t.parentId);
    expect(roots.length).toBe(3);
    expect(roots.map((t) => t.name).sort()).toEqual([
      'Income type',
      'Investment',
      'Purpose',
    ]);
  });

  it('each root has exactly 3 children', () => {
    const tags = createSystemTags();
    const roots = tags.filter((t) => !t.parentId);
    for (const root of roots) {
      const children = tags.filter((t) => t.parentId === root.id);
      expect(children.length).toBe(3);
    }
  });

  it('all names match the ADR-0007 canonical list', () => {
    const tags = createSystemTags();
    const names = tags.map((t) => t.name).sort();
    expect(names).toEqual([...SYSTEM_TAG_NAMES].sort());
  });

  it('every tag has a non-empty color', () => {
    const tags = createSystemTags();
    expect(tags.every((t) => /^#[0-9A-Fa-f]{6}$/.test(t.color))).toBe(true);
  });
});
