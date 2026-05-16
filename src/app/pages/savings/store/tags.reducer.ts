import { createReducer, on } from '@ngrx/store';
import { ITag } from '../../../domain/tag.domain';
import { logout } from '../../../store/user.actions';
import { addTag, deleteTag, editTag, loadTags } from './tags.actions';

export interface ITagsState {
  tagsList: ITag[];
}

const initialTagsState: ITagsState = {
  tagsList: [],
};

/**
 * Tags reducer.
 *
 * Invariants:
 *  - System tags (`system: true`) are immutable: editTag and deleteTag for a
 *    system tag are no-ops at the reducer level. UI also disables those
 *    actions but we defend in depth here (per ADR-0007 §«Користувач не
 *    може видаляти/перейменовувати системні теги»).
 *  - Tag with children: deletion is blocked at the UI level (bottom-sheet
 *    confirm shows a blocking variant). The reducer trusts the UI here
 *    — if a delete reaches us, we drop the row.
 *  - When a tag is deleted, any holding's `tagIds` referencing that id
 *    should be cleaned up — that join happens in `holdings.reducer` (PR4),
 *    not here, to keep this slice independent.
 */
export const tagsReducer = createReducer<ITagsState>(
  initialTagsState,

  on(loadTags, (_state, action) => ({ ...action.payload.state })),

  on(addTag, (state, action) => {
    const updated = Array.isArray(state.tagsList) ? state.tagsList : [];
    return {
      ...state,
      tagsList: [...updated, action.payload.tag],
    };
  }),

  on(editTag, (state, action) => {
    const target = state.tagsList.find((t) => t.id === action.payload.tag.id);
    if (!target || target.system) {
      return state;
    }

    const updatedList = state.tagsList.map((t) =>
      t.id === action.payload.tag.id ? { ...action.payload.tag } : t,
    );
    return {
      ...state,
      tagsList: updatedList,
    };
  }),

  on(deleteTag, (state, action) => {
    const target = state.tagsList.find((t) => t.id === action.payload.id);
    if (!target || target.system) {
      return state;
    }

    return {
      ...state,
      tagsList: state.tagsList.filter((t) => t.id !== action.payload.id),
    };
  }),

  on(logout, () => ({ ...initialTagsState })),
);
