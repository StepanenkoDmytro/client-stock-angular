import { createFeatureSelector } from "@ngrx/store";
import { IUserState } from "./user.reducer";

export const userFeatureSelector = createFeatureSelector<IUserState>('user');