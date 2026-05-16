import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ITag, ITagTree } from '../../../domain/tag.domain';
import { ITagsState } from './tags.reducer';

export const selectTagsState = createFeatureSelector<ITagsState>('tags');

export const selectTagsList = createSelector(
  selectTagsState,
  (state) => state?.tagsList ?? [],
);

export const selectSystemTags = createSelector(selectTagsList, (tags) =>
  tags.filter((t) => t.system),
);

export const selectUserTags = createSelector(selectTagsList, (tags) =>
  tags.filter((t) => !t.system),
);

/**
 * Selector factory: find a tag by id, returns undefined if not found.
 *
 * Usage:
 *   readonly tag = this.store.selectSignal(selectTagById(this.tagId));
 */
export const selectTagById = (id: string | null | undefined) =>
  createSelector(selectTagsList, (tags) =>
    id ? tags.find((t) => t.id === id) : undefined,
  );

/**
 * Selector factory: children of a given parent, sorted with system tags
 * first then alphabetically by name. Pass `null` (or `undefined`) for root
 * children.
 */
export const selectTagsByParent = (parentId: string | null | undefined) =>
  createSelector(selectTagsList, (tags) =>
    tags
      .filter((t) => (t.parentId ?? null) === (parentId ?? null))
      .sort(sortTagsByImportance),
  );

export const selectRootTags = createSelector(selectTagsList, (tags) =>
  tags.filter((t) => !t.parentId).sort(sortTagsByImportance),
);

/**
 * Selector factory: returns the tag with the given id and all its
 * descendants recursively. Used for filter queries («all holdings under
 * Investment subtree») once holdings store lands in PR4.
 */
export const selectTagSubtree = (rootId: string) =>
  createSelector(selectTagsList, (tags) => collectSubtree(tags, rootId));

/**
 * Full nested ITagTree[] projection for accordion rendering.
 *
 * Single pass: build a Map<parentId, ITag[]> then recursively walk roots.
 * O(N) on tag count.
 */
export const selectTagTree = createSelector(
  selectTagsList,
  (tags): ITagTree[] => {
    const byParent = new Map<string | null, ITag[]>();
    for (const tag of tags) {
      const key = tag.parentId ?? null;
      const bucket = byParent.get(key) ?? [];
      bucket.push(tag);
      byParent.set(key, bucket);
    }

    const buildChildren = (parentId: string): ITagTree[] => {
      const children = (byParent.get(parentId) ?? []).slice().sort(
        sortTagsByImportance,
      );
      return children.map((c) => ({
        ...c,
        children: buildChildren(c.id),
      }));
    };

    const roots = (byParent.get(null) ?? []).slice().sort(sortTagsByImportance);
    return roots.map((root) => ({
      ...root,
      children: buildChildren(root.id),
    }));
  },
);

/**
 * Selector factory: chain of ancestors from root → ... → tag itself.
 * Empty array if tag not found. Used by tag-form for breadcrumb / path
 * display, and by validators for cycle detection.
 */
export const selectTagAncestors = (id: string) =>
  createSelector(selectTagsList, (tags) => {
    const result: ITag[] = [];
    let current = tags.find((t) => t.id === id);
    const visited = new Set<string>();
    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      result.unshift(current);
      current = current.parentId
        ? tags.find((t) => t.id === current!.parentId)
        : undefined;
    }
    return result;
  });

// -- helpers --

function sortTagsByImportance(a: ITag, b: ITag): number {
  // System tags first, then alphabetical by name.
  if (a.system !== b.system) {
    return a.system ? -1 : 1;
  }
  return a.name.localeCompare(b.name);
}

function collectSubtree(tags: ITag[], rootId: string): ITag[] {
  const root = tags.find((t) => t.id === rootId);
  if (!root) {
    return [];
  }
  const result: ITag[] = [root];
  const queue: string[] = [rootId];
  const visited = new Set<string>([rootId]);
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    for (const t of tags) {
      if (t.parentId === currentId && !visited.has(t.id)) {
        visited.add(t.id);
        result.push(t);
        queue.push(t.id);
      }
    }
  }
  return result;
}
