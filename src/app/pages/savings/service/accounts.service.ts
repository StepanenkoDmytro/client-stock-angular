import { Injectable, inject } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Observable, filter, map, of, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { IAccountV2 } from '../../../domain/account-v2.domain';
import {
  addAccount,
  deleteAccount,
  editAccount,
  loadAccounts,
} from '../store/accounts.actions';
import { IAccountsState } from '../store/accounts.reducer';
import {
  selectAccountsList,
  selectAccountsState,
} from '../store/accounts.selectors';
import {
  AccountApiDto,
  AccountCreateRequest,
  AccountUpdateRequest,
  AccountsApiService,
} from './accounts-api.service';

/**
 * AccountsService — REST-first CRUD with localStorage cache.
 *
 * <p>Mirror of {@code HoldingService} / {@code TagsService} (Phase-0/1):
 * <ul>
 *   <li><b>Production</b> — backend is the source of truth. {@link #init}
 *       shows the localStorage cache for instant UX, then re-hydrates
 *       from `GET /api/v1/accounts`. Writes go through REST and dispatch
 *       the server-shaped row on success; caller's subscribe handler
 *       shows a contextual snackbar on error.</li>
 *   <li><b>Demo mode</b> (`environment.demoData=true`) — short-circuits
 *       to a local store. No seed list — the holdings demo seed inlines
 *       its own per-account labels.</li>
 * </ul>
 */
@Injectable({ providedIn: 'root' })
export class AccountsService {
  private static readonly STORAGE_KEY = 'accounts-list';

  private readonly store$ = inject(Store<{ accounts: IAccountsState }>);
  private readonly api = inject(AccountsApiService);

  private isInit = false;

  init(): void {
    if (this.isInit) {
      return;
    }
    this.isInit = true;
    this.bootstrap();

    this.store$
      .pipe(
        select(selectAccountsState),
        filter((state) => !!state),
      )
      .subscribe((state) => {
        localStorage.setItem(AccountsService.STORAGE_KEY, JSON.stringify(state));
      });

    window.addEventListener('storage', (event) => {
      if (event.key === AccountsService.STORAGE_KEY) {
        this.bootstrap(true);
      }
    });
  }

  getAll(): Observable<IAccountV2[]> {
    return this.store$.pipe(select(selectAccountsList));
  }

  /** REST-first create. Caller subscribes for snackbar + navigate. */
  addAccount(input: AccountCreateRequest): Observable<IAccountV2> {
    if (environment.demoData) {
      const local: IAccountV2 = {
        id: `local-${Date.now()}`,
        accountType: input.accountType,
        accountNumber: input.accountNumber,
        provider: input.provider,
        currency: input.currency,
      };
      this.store$.dispatch(addAccount({ account: local }));
      return of(local);
    }
    return this.api.create(input).pipe(
      map(AccountsService.fromApiDto),
      tap((saved) => this.store$.dispatch(addAccount({ account: saved }))),
    );
  }

  /** REST-first edit. Server-canonical row replaces the store row on success. */
  updateAccount(id: string, input: AccountUpdateRequest): Observable<IAccountV2> {
    if (environment.demoData) {
      // Build the patched local row from the current state for demo mode.
      let current: IAccountV2 | undefined;
      this.store$
        .pipe(select(selectAccountsList))
        .subscribe((list) => { current = list.find((a) => a.id === id); })
        .unsubscribe();
      if (!current) {
        return of(undefined as unknown as IAccountV2);
      }
      const patched: IAccountV2 = {
        ...current,
        accountType: input.accountType ?? current.accountType,
        accountNumber: input.accountNumber ?? current.accountNumber,
        provider: input.provider ?? current.provider,
        currency: input.currency ?? current.currency,
        syncStatus: input.syncStatus ?? current.syncStatus,
      };
      this.store$.dispatch(editAccount({ account: patched }));
      return of(patched);
    }
    return this.api.update(id, input).pipe(
      map(AccountsService.fromApiDto),
      tap((saved) => this.store$.dispatch(editAccount({ account: saved }))),
    );
  }

  /**
   * REST-first delete. CASCADE FK on the backend wipes any holdings on
   * this account — the AccountsListComponent calls this only after the
   * confirm bottom-sheet, so the user is warned.
   */
  deleteAccount(id: string): Observable<void> {
    if (environment.demoData) {
      this.store$.dispatch(deleteAccount({ id }));
      return of(void 0);
    }
    return this.api.delete(id).pipe(
      tap(() => this.store$.dispatch(deleteAccount({ id }))),
    );
  }

  // ---- internal ----

  private bootstrap(forceReload = false): void {
    const raw = localStorage.getItem(AccountsService.STORAGE_KEY);
    let usedCache = false;
    if (raw) {
      try {
        const state = JSON.parse(raw) as IAccountsState;
        this.store$.dispatch(loadAccounts({ state }));
        usedCache = true;
        if (environment.demoData) return;
      } catch {
        // Corrupted snapshot — fall through.
      }
    }

    if (forceReload) {
      return;
    }

    if (!environment.demoData) {
      if (!usedCache) {
        this.store$.dispatch(loadAccounts({ state: { accountsList: [] } }));
      }
      this.hydrateFromBackend();
      return;
    }

    // Demo mode with empty cache — start empty; mock-seed adds inline labels
    // on holdings directly without needing an Account entity.
    if (!usedCache) {
      this.store$.dispatch(loadAccounts({ state: { accountsList: [] } }));
    }
  }

  private hydrateFromBackend(): void {
    this.api.list().subscribe({
      next: (dtos) => {
        const list = dtos.map(AccountsService.fromApiDto);
        this.store$.dispatch(loadAccounts({ state: { accountsList: list } }));
      },
      error: () => {
        // Keep cache; ApiErrorInterceptor surfaced the snackbar.
      },
    });
  }

  /**
   * Backend {@link AccountApiDto} → frontend {@link IAccountV2}. Numeric
   * id is stringified to match the other entity ids in the store.
   */
  private static fromApiDto(d: AccountApiDto): IAccountV2 {
    return {
      id: String(d.id),
      accountType: d.accountType,
      accountNumber: d.accountNumber ?? undefined,
      provider: d.provider ?? undefined,
      lastSyncedAt: d.lastSyncedAt ?? undefined,
      syncStatus: d.syncStatus ?? undefined,
      currency: d.currency ?? undefined,
    };
  }
}
