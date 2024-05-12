import { createAction } from "@ngrx/store";

export const deleteUnsavedData = 
    createAction(
        '[SYNC-DATA] Delete unsaved data'
    );
    