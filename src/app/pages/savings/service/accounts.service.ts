import { Injectable, inject } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Observable, filter, map, of, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { IAccountV2 } from '../../../domain/account-v2.domain';
import { buildDemoAccounts } from '../model/account-defaults.constants';
import {
  addAccount,
  deleteAccount,
  editAccount,
  loadAccounts,
  markAccountSync,
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
  private static readonly SEED_VERSION_KEY = 'accounts-seed-version';

  /**
   * Bumps every time {@link buildDemoAccounts} changes shape or membership
   * in a way that would clash with the existing demo-cache. Same idea as
   * `HoldingService.SEED_VERSION` — mismatch wipes the cached list so
   * dev users automatically pick up new fixtures instead of staring at
   * a stale snapshot from yesterday's session.
   *
   *  v1: 7 fixtures introduced with Stats Task 1 (acc-ibkr / acc-robinhood /
   *      acc-bybit-spot / acc-bybit-earn / acc-trezor / acc-monobank / manual).
   *
   * Production builds never consult this — the backend is the source of
   * truth there.
   */
  private static readonly SEED_VERSION = 1;

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
        jurisdiction: input.jurisdiction,
      };
      this.store$.dispatch(addAccount({ account: local }));
      return of(local);
    }
    return this.api.create(input).pipe(
      map(AccountsService.fromApiDto),
      // Backend doesn't persist jurisdiction yet — Stats Task 3 Phase 1
      // is frontend-only. Pin the user's chosen value onto the canonical
      // server row before dispatching so the widget sees it. Drop this
      // line once the Liquibase migration lands and the DTO includes it.
      map((saved) => ({ ...saved, jurisdiction: input.jurisdiction })),
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
        jurisdiction: input.jurisdiction !== undefined ? input.jurisdiction : current.jurisdiction,
      };
      this.store$.dispatch(editAccount({ account: patched }));
      return of(patched);
    }
    return this.api.update(id, input).pipe(
      map(AccountsService.fromApiDto),
      // Same frontend-only jurisdiction pin as in addAccount — preserve
      // the user's edit until the backend column lands.
      map((saved) => ({
        ...saved,
        jurisdiction: input.jurisdiction !== undefined ? input.jurisdiction : saved.jurisdiction,
      })),
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

  /**
   * STUB — fake sync retry. Real provider integration (IBKR / Bybit /
   * Mono / Trezor) lands in M7+ PRs; until then this just stamps
   * `lastSyncedAt = now` + sets status to OK so the UX flow exists
   * (user taps ⋯ → Retry → amber dot turns green for 60s).
   *
   * <p>The frontend logs a console.warn so anyone debugging knows the
   * green dot is a fiction. When the real sync ships, this method
   * becomes a thin wrapper over `POST /api/v1/accounts/{id}/sync`.
   */
  retrySync(id: string): void {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn(
        'AccountsService.retrySync: M5 stub — no upstream call. ' +
          'Real IBKR/Bybit/Mono sync lands in M7+ provider PRs.',
      );
    }
    this.store$.dispatch(
      markAccountSync({
        id,
        syncedAt: new Date().toISOString(),
        status: 'OK',
      }),
    );
  }

  // ---- internal ----

  private bootstrap(forceReload = false): void {
    const raw = localStorage.getItem(AccountsService.STORAGE_KEY);
    const cachedVersion = Number(
      localStorage.getItem(AccountsService.SEED_VERSION_KEY) ?? '0',
    );
    const seedOutdated =
      environment.demoData && cachedVersion !== AccountsService.SEED_VERSION;

    let usedCache = false;
    if (raw && !seedOutdated) {
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

    if (seedOutdated) {
      // Wipe stale demo cache so the new fixtures take over cleanly —
      // mirrors the pattern in HoldingService.bootstrap.
      localStorage.removeItem(AccountsService.STORAGE_KEY);
    }

    // Demo mode with empty (or wiped) cache — seed the 7 fixtures from
    // account-defaults.constants. Their ids match the literals used in
    // HoldingService.seedMockHoldings, so widgets that join holdings ×
    // accounts (Stats Task 1) have something to render out of the box.
    if (!usedCache) {
      this.store$.dispatch(loadAccounts({ state: { accountsList: buildDemoAccounts() } }));
      localStorage.setItem(
        AccountsService.SEED_VERSION_KEY,
        String(AccountsService.SEED_VERSION),
      );
    }
  }

  private hydrateFromBackend(): void {
    this.api.list().subscribe({
      next: (dtos) => {
        const list = dtos.map(AccountsService.fromApiDto);
        this.store$.dispatch(loadAccounts({ state: { accountsList: list } }));
        // First-run user: server returned empty list AND we have no
        // local cache → seed a single MANUAL account so the picker on
        // /savings/add-holding has at least one option. Per PR-A6 §5
        // "Bootstrap and seed". The user can rename / delete it later.
        if (list.length === 0) {
          this.seedManualAccount();
        }
      },
      error: () => {
        // Keep cache; ApiErrorInterceptor surfaced the snackbar.
      },
    });
  }

  /**
   * One-time seed of a default MANUAL account for first-run users.
   * Posts to the backend so the row gets a real id; the success path
   * appends to the store via {@link #addAccount}'s tap side effect.
   * Errors are swallowed — interceptor handles user-facing toast.
   */
  private seedManualAccount(): void {
    this.api.create({
      accountType: 'MANUAL',
      accountNumber: 'Manual',
      // no provider/currency — user picks later
    }).subscribe({
      next: (dto) => {
        const seeded = AccountsService.fromApiDto(dto);
        this.store$.dispatch(addAccount({ account: seeded }));
      },
      error: () => {
        // Quietly skip — empty accounts list is recoverable: the user
        // will hit the "Add your first account →" CTA on add-holding.
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
      jurisdiction: d.jurisdiction ?? undefined,
    };
  }
}
