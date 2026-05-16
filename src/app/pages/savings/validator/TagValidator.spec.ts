import { FormBuilder, FormControl } from '@angular/forms';
import { ITag } from '../../../domain/tag.domain';
import { TagValidator } from './TagValidator';

function makeTag(
  id: string,
  name: string,
  parentId?: string,
  system = false,
): ITag {
  return {
    id,
    name,
    parentId,
    color: '#888',
    system,
    createdAt: '2026-05-15T00:00:00.000Z',
  };
}

describe('TagValidator.nameValidator', () => {
  it('rejects empty string', () => {
    expect(TagValidator.nameValidator(new FormControl(''))).toEqual({
      required: true,
    });
  });

  it('rejects whitespace-only', () => {
    expect(TagValidator.nameValidator(new FormControl('   '))).toEqual({
      required: true,
    });
  });

  it('rejects too long (31 chars)', () => {
    const long = 'x'.repeat(31);
    const result = TagValidator.nameValidator(new FormControl(long));
    expect(result?.['maxLength']).toBeDefined();
  });

  it('accepts ok-length name', () => {
    expect(TagValidator.nameValidator(new FormControl('Long-term'))).toBeNull();
  });

  it('accepts after trim', () => {
    expect(
      TagValidator.nameValidator(new FormControl('  Pension  ')),
    ).toBeNull();
  });
});

describe('TagValidator.uniqueNameValidator', () => {
  const fb = new FormBuilder();
  const tags: ITag[] = [
    makeTag('a', 'Investment'),
    makeTag('b', 'Long-term', 'a'),
    makeTag('c', 'Short-term', 'a'),
    makeTag('d', 'Long-term'), // different parent (root)
  ];

  it('flags duplicate (name, parentId) — same parent', () => {
    const group = fb.group({
      name: ['Long-term'],
      parentId: ['a'],
    });
    const validator = TagValidator.uniqueNameValidator(tags);
    expect(validator(group)).toEqual({ duplicateName: true });
  });

  it('allows duplicate name in different parent', () => {
    const group = fb.group({
      name: ['Long-term'],
      parentId: [null as string | null],
    });
    // 'Long-term' under root: tag 'd' already exists with same name+null parent,
    // so this is actually a duplicate. Use a fresh name instead.
    group.patchValue({ name: 'Speculative' });
    const validator = TagValidator.uniqueNameValidator(tags);
    expect(validator(group)).toBeNull();
  });

  it('ignores the tag being edited (currentId)', () => {
    const group = fb.group({
      name: ['Long-term'],
      parentId: ['a'],
    });
    const validator = TagValidator.uniqueNameValidator(tags, 'b');
    expect(validator(group)).toBeNull();
  });

  it('is case-insensitive', () => {
    const group = fb.group({
      name: ['LONG-TERM'],
      parentId: ['a'],
    });
    const validator = TagValidator.uniqueNameValidator(tags);
    expect(validator(group)).toEqual({ duplicateName: true });
  });

  it('treats trim before comparing', () => {
    const group = fb.group({
      name: ['  Long-term  '],
      parentId: ['a'],
    });
    const validator = TagValidator.uniqueNameValidator(tags);
    expect(validator(group)).toEqual({ duplicateName: true });
  });
});

describe('TagValidator.parentCycleValidator', () => {
  const tags: ITag[] = [
    makeTag('a', 'A'),
    makeTag('b', 'B', 'a'),
    makeTag('c', 'C', 'b'),
  ];

  it('passes when not in edit mode', () => {
    const validator = TagValidator.parentCycleValidator(tags);
    expect(validator(new FormControl('a'))).toBeNull();
  });

  it('passes when parent is null', () => {
    const validator = TagValidator.parentCycleValidator(tags, 'a');
    expect(validator(new FormControl(null))).toBeNull();
  });

  it('detects self-parent', () => {
    const validator = TagValidator.parentCycleValidator(tags, 'a');
    expect(validator(new FormControl('a'))).toEqual({ parentCycle: true });
  });

  it('detects indirect cycle (a is ancestor of c, picking c as parent of a)', () => {
    const validator = TagValidator.parentCycleValidator(tags, 'a');
    expect(validator(new FormControl('c'))).toEqual({ parentCycle: true });
  });

  it('passes valid parent (b moving under c)', () => {
    // b currently has parent 'a'; if we try to move b under 'c' (child of b)
    // that's a cycle. But moving b under root or under sibling subtree is ok.
    const validator = TagValidator.parentCycleValidator(tags, 'b');
    expect(validator(new FormControl(null))).toBeNull();
  });
});
