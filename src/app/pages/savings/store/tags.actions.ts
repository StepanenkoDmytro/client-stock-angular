import { createAction } from '@ngrx/store';
import { ITag } from '../../../domain/tag.domain';
import { ITagsState } from './tags.reducer';

/**
 * Tags state lifecycle. Mirrors the action style of `assets.actions.ts`:
 * payload-wrapped object literal, brackets-prefixed type strings for
 * DevTools readability.
 */

export const loadTags = createAction(
  '[TAGS] Load Tags',
  (payload: { state: ITagsState }) => ({ payload }),
);

export const addTag = createAction(
  '[TAGS] Add Tag',
  (payload: { tag: ITag }) => ({ payload }),
);

export const editTag = createAction(
  '[TAGS] Edit Tag',
  (payload: { tag: ITag }) => ({ payload }),
);

export const deleteTag = createAction(
  '[TAGS] Delete Tag',
  (payload: { id: string }) => ({ payload }),
);
